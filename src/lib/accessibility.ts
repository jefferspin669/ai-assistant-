export type AccessibilitySettings = {
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  captions: boolean;
  voiceControlHints: boolean;
  screenReaderHints: boolean;
  keyboardHints: boolean;
  colorBlindCalendar: boolean;
  calendarShowLabels: boolean;
  calendarShowIcons: boolean;
};

const STORAGE_KEY = "atlas-a11y-v1";

export function defaultAccessibility(): AccessibilitySettings {
  return {
    largeText: false,
    highContrast: false,
    reducedMotion: false,
    captions: true,
    voiceControlHints: true,
    screenReaderHints: true,
    keyboardHints: true,
    colorBlindCalendar: true,
    calendarShowLabels: true,
    calendarShowIcons: true,
  };
}

export function loadAccessibility(): AccessibilitySettings {
  if (typeof window === "undefined") return defaultAccessibility();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAccessibility();
    return { ...defaultAccessibility(), ...(JSON.parse(raw) as Partial<AccessibilitySettings>) };
  } catch {
    return defaultAccessibility();
  }
}

export function saveAccessibility(settings: AccessibilitySettings) {
  if (typeof window === "undefined") return settings;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  applyAccessibility(settings);
  return settings;
}

export function applyAccessibility(settings: AccessibilitySettings = loadAccessibility()) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.a11yLargeText = settings.largeText ? "1" : "0";
  root.dataset.a11yContrast = settings.highContrast ? "1" : "0";
  root.dataset.a11yMotion = settings.reducedMotion ? "reduce" : "ok";
  root.dataset.a11yCaptions = settings.captions ? "1" : "0";
  root.dataset.a11yVoice = settings.voiceControlHints ? "1" : "0";
  root.dataset.a11yCalendarLabels = settings.calendarShowLabels ? "1" : "0";
  root.dataset.a11yCalendarIcons = settings.calendarShowIcons ? "1" : "0";
  root.dataset.a11yColorBlind = settings.colorBlindCalendar ? "1" : "0";
}

export const A11Y_OPTIONS: {
  key: keyof AccessibilitySettings;
  title: string;
  plain: string;
}[] = [
  { key: "keyboardHints", title: "Keyboard navigation", plain: "Use Tab, Enter, and Escape throughout Atlas. Focus rings stay visible." },
  { key: "screenReaderHints", title: "Screen readers", plain: "Meaningful labels and live status announcements for sync and errors." },
  { key: "largeText", title: "Large text", plain: "Increase base text size across the app shell." },
  { key: "highContrast", title: "High contrast", plain: "Stronger borders and text contrast for readability." },
  { key: "reducedMotion", title: "Reduced motion", plain: "Minimize animations and pulsing indicators." },
  { key: "captions", title: "Captions", plain: "Show text captions for voice and media demos." },
  { key: "voiceControlHints", title: "Voice control", plain: "Keep voice command hints visible in Command Center and Voice pages." },
  { key: "colorBlindCalendar", title: "Color-blind-friendly calendar", plain: "Use patterns plus labels/icons — never color alone." },
  { key: "calendarShowLabels", title: "Calendar labels", plain: "Always show category names on events." },
  { key: "calendarShowIcons", title: "Calendar icons", plain: "Show a category icon next to every event." },
];

export const CATEGORY_ICONS: Record<string, string> = {
  meetings: "◎",
  personal: "☺",
  work: "▣",
  deadlines: "⚑",
  bills: "$",
  taxes: "§",
  "high-priority": "!",
  family: "⌂",
  school: "▤",
  travel: "✈",
  fitness: "✦",
};

export function categoryIcon(categoryId: string) {
  return CATEGORY_ICONS[categoryId] || "•";
}
