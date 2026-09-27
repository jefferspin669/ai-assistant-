import { isDemoWorkspace } from "@/lib/workspace-mode";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export type ReviewSource = {
  id: string;
  name: string;
  connected: boolean;
};

export type ReviewItem = {
  id: string;
  source: string;
  author: string;
  rating: number;
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  at: string;
  draftReply?: string;
  replyStatus: "none" | "draft" | "pending_approval" | "published";
  serious: boolean;
};

const REVIEWS_KEY = "atlas-reviews-inbox-v1";
const SOURCES_KEY = "atlas-review-sources-v1";
const AUTO_KEY = "atlas-review-auto-reply-v1";

export const DEFAULT_SOURCES: ReviewSource[] = [
  { id: "google", name: "Google Business Profile", connected: false },
  { id: "yelp", name: "Yelp", connected: false },
  { id: "facebook", name: "Facebook Reviews", connected: false },
];

const SEED_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    source: "Google (demo)",
    author: "Elena Brooks",
    rating: 5,
    text: "Technician was on time and explained everything clearly.",
    sentiment: "positive",
    at: "2 days ago",
    replyStatus: "none",
    serious: false,
  },
  {
    id: "rev-2",
    source: "Google (demo)",
    author: "Mike Chen",
    rating: 2,
    text: "Install took longer than promised and we still have a rattling unit.",
    sentiment: "negative",
    at: "5 days ago",
    draftReply:
      "Mike — we're sorry about the delay and the noise. I've flagged this for a senior tech to revisit within 48 hours.",
    replyStatus: "pending_approval",
    serious: true,
  },
];

export function loadReviewSources(): ReviewSource[] {
  const saved = loadJson<ReviewSource[]>(SOURCES_KEY, []);
  return saved.length ? saved : DEFAULT_SOURCES;
}

export function saveReviewSources(sources: ReviewSource[]) {
  saveJson(SOURCES_KEY, sources);
}

export function loadReviews(): ReviewItem[] {
  const saved = loadJson<ReviewItem[]>(REVIEWS_KEY, []);
  if (saved.length) return saved;
  return isDemoWorkspace() ? SEED_REVIEWS : [];
}

export function saveReviews(items: ReviewItem[]) {
  saveJson(REVIEWS_KEY, items);
}

export function draftReviewReply(reviewId: string, text: string) {
  const items = loadReviews().map((r) =>
    r.id === reviewId ? { ...r, draftReply: text, replyStatus: "draft" as const } : r,
  );
  saveReviews(items);
}

export function submitReplyForApproval(reviewId: string) {
  const items = loadReviews().map((r) =>
    r.id === reviewId ? { ...r, replyStatus: "pending_approval" as const } : r,
  );
  saveReviews(items);
}

export function approveReply(reviewId: string) {
  const items = loadReviews().map((r) =>
    r.id === reviewId ? { ...r, replyStatus: "published" as const } : r,
  );
  saveReviews(items);
}

export function autoReplyEnabled(): boolean {
  return loadJson(AUTO_KEY, false);
}

export function setAutoReply(enabled: boolean) {
  saveJson(AUTO_KEY, enabled);
}

export function reputationMode(): "LIVE" | "DEMO" {
  return loadReviewSources().some((s) => s.connected) ? "LIVE" : "DEMO";
}

export function classifySentiment(text: string, rating: number): ReviewItem["sentiment"] {
  if (rating <= 2 || /bad|late|broken|never/i.test(text)) return "negative";
  if (rating >= 4) return "positive";
  return "neutral";
}

export function recurringComplaints(): string[] {
  const negative = loadReviews().filter((r) => r.sentiment === "negative");
  const themes: Record<string, number> = {};
  for (const r of negative) {
    if (/late|delay/i.test(r.text)) themes["Delays"] = (themes["Delays"] ?? 0) + 1;
    if (/noise|rattle|broken/i.test(r.text)) themes["Install quality"] = (themes["Install quality"] ?? 0) + 1;
  }
  return Object.entries(themes)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} (${n})`);
}
