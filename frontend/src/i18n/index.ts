import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const RTL_LANGS = new Set(["ar"]);

function normalizeLanguage(language?: string): string {
  if (!language) return "fr";
  return language.toLowerCase().split("-")[0];
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
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar },
    },
    supportedLngs: ["fr", "en", "ar"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    fallbackLng: "fr",
    returnNull: false,
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