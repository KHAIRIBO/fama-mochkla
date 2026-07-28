"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { TRANSLATIONS, RTL_LANGUAGES, type Language, type TranslationKey } from "./translations";

const STORAGE_KEY = "fama-mochkla:lang";

type Vars = Record<string, string | number>;

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{{${key}}}`
  );
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: "ltr" | "rtl";
  t: (path: NestedKeyPaths, vars?: Vars) => string;
}

// Generates dotted key paths like "nav.liveMap" from the translation object shape.
export type NestedKeyPaths = {
  [K in keyof TranslationKey]: `${K & string}.${keyof TranslationKey[K] & string}`;
}[keyof TranslationKey];

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && saved in TRANSLATIONS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading persisted preference (client-only) on mount
      setLanguageState(saved);
    }
  }, []);

  const dir = RTL_LANGUAGES.includes(language) ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (path: NestedKeyPaths, vars?: Vars) => {
      const value = getByPath(TRANSLATIONS[language], path);
      const fallback = getByPath(TRANSLATIONS.en, path);
      const str = typeof value === "string" ? value : typeof fallback === "string" ? fallback : path;
      return interpolate(str, vars);
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
