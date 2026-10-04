import { writeAudit } from "@/lib/services/audit";
import { notify } from "@/lib/services/jobs";
import { sendSms } from "@/lib/integrations/twilio";
import { sendEmail } from "@/lib/integrations/resend";
import { beginJob, claimCustomerMessage, claimExactOnce, finishJob } from "@/lib/safety/idempotency";
import { isPaymentKind, paymentAttemptOutcome } from "@/lib/safety/guards";
import { recordDeadLetter } from "@/lib/queue/dead-letter";
import { getExecutionPolicy } from "@/lib/autonomy/policy";
import { decideWork } from "@/lib/autonomy/engine";
import { database } from "@/lib/services/access";
import { nowIso, saveDatabase } from "@/lib/db/store";

type JobBody = {
  jobId: string;
  organizationId: string;
  userId: string;
  payload: Record<string, unknown>;
  attemptsMade?: number;
};

function ctx(job: JobBody) {
  return {
    userId: job.userId || "atlas",
    organizationId: job.organizationId,
    role: "owner" as const,
    sessionId: "worker",
  };
}

async function recordJobResult(job: JobBody, status: "done" | "failed", error?: string) {
  if (process.env.DATABASE_URL?.trim()) {
    const { getPostgresClient } = await import("@/lib/db/postgres");
    const sql = getPostgresClient();
    await sql`UPDATE jobs SET status = ${status}, run_at = ${nowIso()}, last_error = ${error || null},
      version = version + 1 WHERE id = ${job.jobId} AND organization_id = ${job.organizationId}`;
  }
  const db = database();
  if (!db.jobs.some((row) => row.id === job.jobId && row.organization_id === job.organizationId)) return;
  saveDatabase({
    ...db,
    jobs: db.jobs.map((row) =>
      row.id === job.jobId && row.organization_id === job.organizationId
        ? { ...row, status, run_at: nowIso(), payload: { ...row.payload, ...(error ? { error } : {}) } }
        : row,
    ),
  });
}

/** Workers run even if nobody has the website open. */
export async function handleQueuedWork(kind: string, job: JobBody) {
  if (kind.startsWith("autonomy:")) {
    throw new Error("Autonomy action has no verified executor; no work was performed.");
  }
  const session = ctx(job);
  const summary = `${kind} ${job.jobId}`;

  if (beginJob(job.jobId) === "duplicate") {
    writeAudit(session, {
      action: `worker:duplicate:${summary}`,
      entityType: "job",
      entityId: job.jobId,
      actorLabel: "Atlas Worker",
    });
    return { ok: true, kind, skipped: "duplicate" as const };
  }

  try {
    if (kind.startsWith("orchestrator:")) {
      const { tickRun, getRun, tickDueOrchestratorRuns } = await import("@/lib/orchestrator");
      if (kind === "orchestrator:tick-due") {
        await tickDueOrchestratorRuns();
        await recordJobResult(job, "done");
        finishJob(job.jobId, true);
        return { ok: true, kind };
      }
      const runId = String(job.payload.runId || "");
      const run = getRun(runId, job.organizationId);
      if (run) await tickRun(run);
      await recordJobResult(job, "done");
      finishJob(job.jobId, true);
      return { ok: true, kind };
    }

    if (isPaymentKind(kind)) {
      const attempt = Math.max(job.attemptsMade || 1, 1);
      const outcome = paymentAttemptOutcome(attempt);
      if (outcome === "dead_letter") {
        recordDeadLetter({
          jobId: job.jobId,
          kind,
          organizationId: job.organizationId,
          error: "max payment attempts exceeded",
          attempts: attempt,
        });
        writeAudit(session, {
          action: `worker:dead_letter:${summary}`,
          entityType: "job",
          entityId: job.jobId,
          actorLabel: "Atlas Worker",
        });
        await recordJobResult(job, "failed", "max payment attempts exceeded");
        finishJob(job.jobId, true);
        return { ok: false, kind, skipped: "dead_letter" as const };
      }
    }

    if (kind === "missed-call-follow-up" || kind === "waitlist-contact" || kind === "invoice-overdue-reminder") {
      const autonomyKind = kind === "invoice-overdue-reminder" ? "invoice_reminder" : "customer_follow_up";
      const verdict = decideWork(
        { kind: autonomyKind, title: kind, summary: "Customer outreach" },
        await getExecutionPolicy(job.organizationId),
      );
      if (verdict.verdict !== "execute") {
        throw new Error(`Customer outreach needs owner review: ${verdict.reason}`);
      }
      const to = String(job.payload.phone || job.payload.from || job.payload.to || "");
      const body =
        kind === "invoice-overdue-reminder"
          ? "Atlas: a reminder that an invoice is still open. Reply if you need a copy."
          : "Atlas: we missed you — reply and we will get you on the schedule.";
      if (!to && !job.payload.email) throw new Error("No customer contact method. Nothing was sent.");
      let delivered = false;
      if (to) {
        if (!(await claimExactOnce(`outreach:${job.organizationId}:${job.jobId}:sms`)).allowed) {
          throw new Error("SMS outcome already reserved. Review delivery before retrying.");
        }
        const claim = await claimCustomerMessage({
          organizationId: job.organizationId,
          to,
          kind,
        });
        if (!claim.allowed) {
          writeAudit(session, {
            action: `worker:rate_limited:${summary}`,
            entityType: "job",
            entityId: job.jobId,
            actorLabel: "Atlas Worker",
          });
          throw new Error("Daily customer message limit reached. Nothing was sent.");
        }
        const sent = await sendSms({ to, body, organizationId: job.organizationId });
        if (!sent.ok || sent.mode !== "live") {
          throw new Error(sent.error || "Live SMS provider is unavailable. Nothing was sent.");
        }
        delivered = true;
      }
      const email = String(job.payload.email || "");
      if (email) {
        if (!(await claimExactOnce(`outreach:${job.organizationId}:${job.jobId}:email`)).allowed) {
          throw new Error("Email outcome already reserved. Review delivery before retrying.");
        }
        const sent = await sendEmail({
          to: email,
          subject: "Atlas follow-up",
          text: body,
          organizationId: job.organizationId,
        });
        if (!sent.ok || sent.simulated) {
          throw new Error(sent.ok ? "Live email provider is unavailable. Nothing was sent." : sent.error);
        }
        delivered = true;
      }
      if (!delivered) throw new Error("No verified customer delivery. Nothing was sent.");
    }

    if (kind === "send_message") {
      if ((await getExecutionPolicy(job.organizationId)).killSwitch) {
        throw new Error("Emergency pause is on. Customer message was not sent.");
      }
      const to = String(job.payload.phone || job.payload.to || "");
      const body = String(job.payload.body || job.payload.message || "");
      const taskId = String(job.payload.taskId || "");
      const onceKey = taskId
        ? `task_notify:${job.organizationId}:${taskId}`
        : `send_message:${job.organizationId}:${to}:${body.slice(0, 64)}`;
      if (!body.trim()) throw new Error("Customer message is empty. Nothing was sent.");
      if (to) {
        const once = await claimExactOnce(onceKey);
        if (!once.allowed) {
          writeAudit(session, {
            action: `worker:duplicate_notify:${summary}`,
            entityType: "job",
            entityId: job.jobId,
            actorLabel: "Atlas Worker",
          });
          throw new Error("Notification was already claimed. Verify its delivery before retrying.");
        }
        const sent = await sendSms({ to, body, organizationId: job.organizationId });
        if (!sent.ok || sent.mode !== "live") {
          throw new Error(sent.error || "Live SMS provider is unavailable. Nothing was sent.");
        }
        writeAudit(session, {
          action: "sent customer notification",
          entityType: "customer",
          entityId: String(job.payload.customerId || ""),
          actorLabel: "Atlas Worker",
        });
      } else {
        const toEmail = String(job.payload.email || "");
        if (!toEmail) throw new Error("No customer phone or email. Nothing was sent.");
        const once = await claimExactOnce(`email:${onceKey}:${toEmail}`);
        if (!once.allowed) throw new Error("Email was already claimed. Verify delivery before retrying.");
        const sent = await sendEmail({
          to: toEmail,
          subject: "Atlas follow-up",
          text: body,
          organizationId: job.organizationId,
        });
        if (!sent.ok || sent.simulated) {
          throw new Error(sent.ok ? "Live email provider is unavailable. Nothing was sent." : sent.error);
        }
      }
    }

    if (
      ![
        "missed-call-follow-up",
        "waitlist-contact",
        "invoice-overdue-reminder",
        "send_message",
      ].includes(kind) &&
      !kind.startsWith("orchestrator:")
    ) {
      throw new Error("No verified executor for this job. Nothing was sent, changed, or paid.");
    }

    writeAudit(session, {
      action: `worker:${summary}`,
      entityType: "job",
      entityId: job.jobId,
      actorLabel: "Atlas Worker",
    });
    await recordJobResult(job, "done");
    notify(session, `Job ${kind} finished`, "Background work completed.");
    finishJob(job.jobId, true);
    return { ok: true, kind };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Background work failed.";
    await recordJobResult(job, "failed", reason);
    writeAudit(session, {
      action: `worker:failed:${kind}`,
      entityType: "job",
      entityId: job.jobId,
      actorLabel: "Atlas Worker",
    });
    notify(session, `Job ${kind} needs attention`, reason);
    finishJob(job.jobId, false);
    throw error;
  }
}
