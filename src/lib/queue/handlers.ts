import { writeAudit } from "@/lib/services/audit";
import { notify } from "@/lib/services/jobs";
import { sendSms } from "@/lib/integrations/twilio";
import { sendEmail } from "@/lib/integrations/resend";
import { beginJob, claimCustomerMessage, finishJob } from "@/lib/safety/idempotency";
import { isPaymentKind, paymentAttemptOutcome } from "@/lib/safety/guards";
import { recordDeadLetter } from "@/lib/queue/dead-letter";

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

/** Workers run even if nobody has the website open. */
export async function handleQueuedWork(kind: string, job: JobBody) {
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
        finishJob(job.jobId, true);
        return { ok: true, kind };
      }
      const runId = String(job.payload.runId || "");
      const run = getRun(runId, job.organizationId);
      if (run) await tickRun(run);
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
        finishJob(job.jobId, true);
        return { ok: false, kind, skipped: "dead_letter" as const };
      }
    }

    if (kind === "missed-call-follow-up" || kind === "waitlist-contact" || kind === "invoice-overdue-reminder") {
      const to = String(job.payload.phone || job.payload.from || job.payload.to || "");
      const body =
        kind === "invoice-overdue-reminder"
          ? "Atlas: a reminder that an invoice is still open. Reply if you need a copy."
          : "Atlas: we missed you — reply and we will get you on the schedule.";
      if (to) {
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
        } else {
          await sendSms({ to, body, organizationId: job.organizationId });
        }
      }
      const email = String(job.payload.email || "");
      if (email) {
        await sendEmail({
          to: email,
          subject: "Atlas follow-up",
          text: body,
          organizationId: job.organizationId,
        });
      }
    }

    writeAudit(session, {
      action: `worker:${summary}`,
      entityType: "job",
      entityId: job.jobId,
      actorLabel: "Atlas Worker",
    });
    notify(session, `Job ${kind} finished`, "Background work completed.");
    finishJob(job.jobId, true);
    return { ok: true, kind };
  } catch (error) {
    finishJob(job.jobId, false);
    throw error;
  }
}
