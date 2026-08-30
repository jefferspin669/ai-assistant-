import { writeAudit } from "@/lib/services/audit";
import { notify } from "@/lib/services/jobs";
import { sendSms } from "@/lib/integrations/twilio";
import { sendEmail } from "@/lib/integrations/resend";

type JobBody = {
  jobId: string;
  organizationId: string;
  userId: string;
  payload: Record<string, unknown>;
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

  if (kind === "missed-call-follow-up" || kind === "waitlist-contact" || kind === "invoice-overdue-reminder") {
    const to = String(job.payload.phone || job.payload.from || job.payload.to || "");
    const body =
      kind === "invoice-overdue-reminder"
        ? "Atlas: a reminder that an invoice is still open. Reply if you need a copy."
        : "Atlas: we missed you — reply and we will get you on the schedule.";
    if (to) {
      await sendSms({ to, body, organizationId: job.organizationId });
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
  return { ok: true, kind };
}
