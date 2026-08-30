"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  APP_LANGUAGES,
  type AppLanguage,
  loadUiLanguage,
  normalizeLanguage,
  saveUiLanguage,
  translate,
  translateAction,
  translateNavLabel,
  translateTitle,
} from "@/lib/i18n";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (lang: string) => void;
  languages: typeof APP_LANGUAGES;
  t: (key: string, fallback?: string) => string;
  tNav: (label: string) => string;
  tTitle: (title: string) => string;
  tAction: (label: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  useEffect(() => {
    const next = loadUiLanguage();
    setLanguageState(next);
    document.documentElement.lang = next;
  }, []);

  const setLanguage = useCallback((lang: string) => {
    const next = normalizeLanguage(lang);
    setLanguageState(next);
    saveUiLanguage(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      languages: APP_LANGUAGES,
      t: (key, fallback) => translate(language, key, fallback),
      tNav: (label) => translateNavLabel(language, label),
      tTitle: (title) => translateTitle(language, title),
      tAction: (label) => translateAction(language, label),
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      language: "en" as AppLanguage,
      setLanguage: () => undefined,
      languages: APP_LANGUAGES,
      t: (key: string, fallback?: string) => translate("en", key, fallback),
      tNav: (label: string) => label,
      tTitle: (title: string) => title,
      tAction: (label: string) => label,
    };
  }
  return ctx;
}
