import { undoRecent } from "@/lib/recovery";
import { submitAccuracyFeedback, getCurrentAccount } from "@/lib/account";

export type FeedbackKind =
  | "helpful"
  | "incorrect"
  | "wrong_category"
  | "undo_action"
  | "report_problem"
  | "suggest_better";

export type FeedbackEntry = {
  id: string;
  kind: FeedbackKind;
  target: string;
  note: string;
  at: string;
  applied: string;
};

const STORAGE_KEY = "atlas-feedback-v1";
const PREFS_KEY = "atlas-feedback-prefs-v1";

export type FeedbackPrefs = {
  preferShorterAnswers: boolean;
  avoidGuessingCategories: boolean;
  confirmBeforeActions: boolean;
  learnedNotes: string[];
};

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `fb_${crypto.randomUUID()}`;
  return `fb_${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

export const FEEDBACK_ACTIONS: { id: FeedbackKind; label: string; blurb: string }[] = [
  { id: "helpful", label: "Helpful", blurb: "This answer helped." },
  { id: "incorrect", label: "Incorrect", blurb: "Atlas got this wrong." },
  { id: "wrong_category", label: "Wrong category", blurb: "Category or label was off." },
  { id: "undo_action", label: "Undo Atlas action", blurb: "Reverse the last Atlas change." },
  { id: "report_problem", label: "Report a problem", blurb: "Something broke or felt unsafe." },
  { id: "suggest_better", label: "Suggest a better answer", blurb: "Tell Atlas what it should have said." },
];

export function loadFeedback(): FeedbackEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FeedbackEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFeedback(items: FeedbackEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 100)));
  void import("@/lib/backend/client").then(({ pushWorkspace }) =>
    pushWorkspace("feedback", items.slice(0, 100)),
  );
}

export function loadFeedbackPrefs(): FeedbackPrefs {
  if (typeof window === "undefined") {
    return {
      preferShorterAnswers: false,
      avoidGuessingCategories: false,
      confirmBeforeActions: true,
      learnedNotes: [],
    };
  }
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      return {
        preferShorterAnswers: false,
        avoidGuessingCategories: false,
        confirmBeforeActions: true,
        learnedNotes: [],
      };
    }
    return {
      preferShorterAnswers: false,
      avoidGuessingCategories: false,
      confirmBeforeActions: true,
      learnedNotes: [],
      ...(JSON.parse(raw) as Partial<FeedbackPrefs>),
    };
  } catch {
    return {
      preferShorterAnswers: false,
      avoidGuessingCategories: false,
      confirmBeforeActions: true,
      learnedNotes: [],
    };
  }
}

function savePrefs(prefs: FeedbackPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  void import("@/lib/backend/client").then(({ pushWorkspace }) =>
    pushWorkspace("feedback-prefs", prefs),
  );
}

export async function hydrateFeedback(): Promise<{
  entries: FeedbackEntry[];
  prefs: FeedbackPrefs;
}> {
  if (typeof window === "undefined") {
    return { entries: [], prefs: loadFeedbackPrefs() };
  }
  try {
    const { pullWorkspace } = await import("@/lib/backend/client");
    const [entries, prefs] = await Promise.all([
      pullWorkspace<FeedbackEntry[]>("feedback"),
      pullWorkspace<FeedbackPrefs>("feedback-prefs"),
    ]);
    if (Array.isArray(entries)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 100)));
    }
    if (prefs && typeof prefs === "object") {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    }
  } catch {
    /* fall through */
  }
  return { entries: loadFeedback(), prefs: loadFeedbackPrefs() };
}

function applyLearning(kind: FeedbackKind, note: string) {
  const prefs = loadFeedbackPrefs();
  const learned = [...prefs.learnedNotes];
  if (kind === "helpful") {
    learned.unshift("Keep answering in this style for this user.");
  }
  if (kind === "incorrect") {
    prefs.preferShorterAnswers = true;
    learned.unshift(note || "Prior answer was incorrect — be more careful next time.");
  }
  if (kind === "wrong_category") {
    prefs.avoidGuessingCategories = true;
    learned.unshift(note || "Ask before assigning categories.");
  }
  if (kind === "suggest_better" && note) {
    learned.unshift(`Preferred answer: ${note}`);
  }
  if (kind === "report_problem") {
    prefs.confirmBeforeActions = true;
    learned.unshift(note || "User reported a problem — tighten confirmations.");
  }
  const next = { ...prefs, learnedNotes: learned.slice(0, 30) };
  savePrefs(next);
  return next;
}

/** Shape Command Center replies using learned feedback prefs. */
export function styleReplyWithFeedback(reply: string): string {
  const prefs = loadFeedbackPrefs();
  let out = reply.trim();
  if (prefs.preferShorterAnswers && out.length > 180) {
    const first = out.split(/(?<=[.!?])\s+/)[0];
    if (first && first.length >= 40) out = first;
  }
  if (prefs.avoidGuessingCategories && /personal|work|categor/i.test(out)) {
    out = `${out} (I’ll ask before guessing Work vs Personal next time.)`;
  }
  return out;
}

export function submitFeedback(input: {
  kind: FeedbackKind;
  target?: string;
  note?: string;
}): { ok: true; entry: FeedbackEntry; message: string } | { ok: false; error: string } {
  const note = (input.note || "").trim();

  if (input.kind === "report_problem" && note.length < 8) {
    return { ok: false, error: "Add a few details about the problem so Atlas can learn." };
  }
  if (input.kind === "suggest_better" && note.length < 4) {
    return { ok: false, error: "Tell Atlas what the better answer should have been." };
  }

  let applied = "Saved for this user’s future experience.";

  if (input.kind === "undo_action") {
    const undo = undoRecent();
    if (!undo.ok) {
      applied = "Nothing to undo right now — correction still saved.";
    } else {
      applied = undo.message;
    }
  }

  applyLearning(input.kind, note);

  if (getCurrentAccount() && (input.kind === "helpful" || input.kind === "incorrect")) {
    submitAccuracyFeedback(input.kind === "helpful" ? 5 : 2, note || input.kind);
  }

  const entry: FeedbackEntry = {
    id: newId(),
    kind: input.kind,
    target: input.target || "Atlas reply",
    note,
    at: nowIso(),
    applied,
  };
  saveFeedback([entry, ...loadFeedback()]);
  return {
    ok: true,
    entry,
    message:
      input.kind === "helpful"
        ? "Thanks — Atlas will keep this style for you."
        : input.kind === "undo_action"
          ? applied
          : input.kind === "report_problem"
            ? "Problem logged with your details — Atlas will be more careful."
            : `Got it — ${applied}`,
  };
}

export function removeFeedback(id: string): FeedbackEntry[] {
  const next = loadFeedback().filter((entry) => entry.id !== id);
  saveFeedback(next);
  return next;
}

export function clearFeedbackLearnedNote(index: number): FeedbackPrefs {
  const prefs = loadFeedbackPrefs();
  const next = {
    ...prefs,
    learnedNotes: prefs.learnedNotes.filter((_, i) => i !== index),
  };
  savePrefs(next);
  return next;
}
