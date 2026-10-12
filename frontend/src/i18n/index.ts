import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

export const SUPPORTED_LANGUAGES = ["fr", "en", "ar"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const RTL_LANGS = new Set(["ar"]);

type Dict = Record<string, unknown>;

/*
| Chaque module a son fichier par langue : locales/<lng>/<module>.json
| Son contenu est exposé sous la clé <module> (ex: t("chef.sidebar.dashboard")).
*/
const moduleFiles = import.meta.glob<Dict>("./locales/*/*.json", {
  eager: true,
  import: "default",
});

function buildResources() {
  const base: Record<AppLanguage, Dict> = {
    fr: { ...fr },
    en: { ...en },
    ar: { ...ar },
  };

  for (const [file, content] of Object.entries(moduleFiles)) {
    const match = file.match(/\.\/locales\/([a-z]+)\/([\w-]+)\.json$/);
    if (!match) continue;

    const [, lng, ns] = match;
    if (!(lng in base)) continue;

    base[lng as AppLanguage][ns] = content;
  }

  return {
    fr: { translation: base.fr },
    en: { translation: base.en },
    ar: { translation: base.ar },
  };
}

export function normalizeLanguage(language?: string): AppLanguage {
  const code = (language ?? "fr").toLowerCase().split("-")[0];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code)
    ? (code as AppLanguage)
    : "fr";
}

function syncDocumentLanguage(language?: string): void {
  if (typeof document === "undefined") return;

  const normalized = normalizeLanguage(language);
  document.documentElement.lang = normalized;
  document.documentElement.dir = RTL_LANGS.has(normalized) ? "rtl" : "ltr";
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: buildResources(),
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    fallbackLng: "fr",
    returnNull: false,
    returnObjects: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "nexus_lang",
    },
  });

i18n.on("languageChanged", (language) => {
  syncDocumentLanguage(language);
});

syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);

export default i18n;
