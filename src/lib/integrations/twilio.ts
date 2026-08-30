import twilio from "twilio";
import { requireLive } from "@/lib/integrations/config";
import { atlasStore } from "@/lib/integrations/supabase";
import { writeJsonFile, readJsonFile } from "@/lib/db/file-persist";
import { emitEvent } from "@/lib/events/bus";

export type MissedCallRecord = {
  id: string;
  from: string;
  to: string;
  receivedAt: string;
  smsSid?: string;
  status: "received" | "sms_sent" | "replied" | "booked" | "escalated";
  leadName?: string;
  notes?: string;
};

type MissedStore = { calls: MissedCallRecord[] };

function loadMissed(): MissedStore {
  return readJsonFile<MissedStore>("missed-calls.json") || { calls: [] };
}

function saveMissed(store: MissedStore) {
  writeJsonFile("missed-calls.json", store);
}

export async function sendSms(input: {
  to: string;
  body: string;
  organizationId?: string;
}): Promise<{ ok: boolean; sid?: string; mode: "live" | "simulation"; error?: string }> {
  const from = process.env.TWILIO_PHONE_NUMBER?.trim() || "";
  if (requireLive("twilio") && from) {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID!.trim(), process.env.TWILIO_AUTH_TOKEN!.trim());
      const message = await client.messages.create({ to: input.to, from, body: input.body });
      await atlasStore.writeAudit({
        organizationId: input.organizationId || atlasStore.defaultOrgId(),
        actor: "Twilio",
        action: "sms.sent",
        detail: { to: input.to, sid: message.sid },
      });
      return { ok: true, sid: message.sid, mode: "live" };
    } catch (error) {
      return {
        ok: false,
        mode: "live",
        error: error instanceof Error ? error.message : "Twilio SMS failed",
      };
    }
  }

  await atlasStore.writeAudit({
    organizationId: input.organizationId || atlasStore.defaultOrgId(),
    actor: "Twilio(simulation)",
    action: "sms.simulated",
    detail: { to: input.to, body: input.body },
  });
  return { ok: true, sid: `sim_${Date.now()}`, mode: "simulation" };
}

/** TwiML for inbound voice — answer, gather intent, or take message. */
export function buildVoiceAnswerTwiml(opts: { gatherActionUrl: string; businessName: string }) {
  const name = opts.businessName.replace(/[<>&]/g, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thanks for calling ${name}. This is Atlas, your AI receptionist.</Say>
  <Gather input="speech dtmf" timeout="4" action="${opts.gatherActionUrl}" method="POST" speechTimeout="auto">
    <Say voice="Polly.Joanna">Press 1 or say book to schedule a visit. Press 2 or say message to leave a message. Press 0 for an emergency.</Say>
  </Gather>
  <Say voice="Polly.Joanna">Sorry, I did not catch that. We will text you shortly.</Say>
</Response>`;
}

export function buildVoiceGatherTwiml(speechOrDigits: string, bookUrl: string) {
  const intent = speechOrDigits.toLowerCase();
  if (intent.includes("0") || intent.includes("emergency")) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Connecting you to the on-call owner for emergencies.</Say>
  <Dial>${process.env.TWILIO_ESCALATE_NUMBER || process.env.TWILIO_PHONE_NUMBER || ""}</Dial>
</Response>`;
  }
  if (intent.includes("1") || intent.includes("book") || intent.includes("schedule") || intent.includes("appointment")) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Got it. I will text you a booking link right after this call.</Say>
  <Redirect method="POST">${bookUrl}</Redirect>
</Response>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Please leave a short message after the tone, and Atlas will follow up by text.</Say>
  <Record maxLength="60" playBeep="true" />
  <Say voice="Polly.Joanna">Thanks. Goodbye.</Say>
</Response>`;
}

export async function handleMissedCall(input: {
  from: string;
  to: string;
  callSid?: string;
}): Promise<MissedCallRecord> {
  const store = loadMissed();
  const record: MissedCallRecord = {
    id: input.callSid || `missed_${Date.now()}`,
    from: input.from,
    to: input.to,
    receivedAt: new Date().toISOString(),
    status: "received",
  };

  const sms = await sendSms({
    to: input.from,
    body: `Hi — this is Atlas for ${process.env.ATLAS_BUSINESS_NAME || "our team"}. Sorry we missed your call. Reply with your name and what you need (e.g. "Jordan — AC not cooling") and I’ll get you on the schedule.`,
  });
  if (sms.ok) {
    record.status = "sms_sent";
    record.smsSid = sms.sid;
  }

  store.calls = [record, ...store.calls].slice(0, 200);
  saveMissed(store);

  await atlasStore.upsertCustomer({
    organizationId: atlasStore.defaultOrgId(),
    fullName: `Caller ${input.from}`,
    phone: input.from,
    notes: "Missed-call recovery lead",
  });

  await atlasStore.writeAudit({
    organizationId: atlasStore.defaultOrgId(),
    actor: "Receptionist",
    action: "missed_call.recovered",
    detail: { from: input.from, smsSid: sms.sid, mode: sms.mode },
  });

  emitEvent({
    type: "call.missed",
    organizationId: atlasStore.defaultOrgId(),
    actorLabel: "Receptionist",
    payload: { from: input.from, to: input.to, callSid: input.callSid, phone: input.from, handled: true },
  });
  emitEvent({
    type: "lead.created",
    organizationId: atlasStore.defaultOrgId(),
    actorLabel: "Receptionist",
    payload: { from: input.from, phone: input.from, source: "missed-call" },
  });

  return record;
}

export async function handleInboundSms(input: {
  from: string;
  body: string;
}): Promise<{ reply: string; booked?: boolean }> {
  const store = loadMissed();
  const open = store.calls.find((c) => c.from === input.from && c.status !== "booked");
  const text = input.body.trim();
  const lower = text.toLowerCase();

  if (open) {
    open.status = "replied";
    open.notes = text;
    const nameMatch = text.split(/[-–—]/)[0]?.trim();
    if (nameMatch) open.leadName = nameMatch.slice(0, 80);
  }

  if (lower.includes("book") || lower.includes("tomorrow") || lower.includes("monday") || lower.includes("am") || lower.includes("pm")) {
    const starts = new Date();
    starts.setDate(starts.getDate() + 1);
    starts.setHours(9, 0, 0, 0);
    const ends = new Date(starts.getTime() + 90 * 60 * 1000);
    await atlasStore.createAppointment({
      organizationId: atlasStore.defaultOrgId(),
      title: `Service visit · ${open?.leadName || input.from}`,
      startsAt: starts.toISOString(),
      endsAt: ends.toISOString(),
      source: "missed-call-sms",
    });
    if (open) open.status = "booked";
    saveMissed(store);
    const reply = `Booked a hold for tomorrow at 9:00 AM. Reply YES to confirm or suggest another time. — Atlas`;
    await sendSms({ to: input.from, body: reply });
    return { reply, booked: true };
  }

  saveMissed(store);
  const reply = `Thanks${open?.leadName ? `, ${open.leadName}` : ""}. I logged that. Reply BOOK tomorrow or tell me a better day/time. — Atlas`;
  await sendSms({ to: input.from, body: reply });
  return { reply, booked: false };
}

export function listMissedCalls() {
  return loadMissed().calls;
}
