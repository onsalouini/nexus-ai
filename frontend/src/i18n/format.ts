import i18n, { normalizeLanguage } from "./index";

/*
| Formats dates / nombres / montants selon la langue active.
| "ar-TN" garde les chiffres latins, cohérents avec les données métier.
*/
const LOCALES = {
  fr: "fr-FR",
  en: "en-GB",
  ar: "ar-TN-u-nu-latn",
} as const;

export function currentLocale(): string {
  return LOCALES[normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)];
}

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
  fallback = "—"
): string {
  const date = toDate(value);
  return date ? date.toLocaleDateString(currentLocale(), options) : fallback;
}

export function formatDateTime(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  fallback = "—"
): string {
  const date = toDate(value);
  return date ? date.toLocaleString(currentLocale(), options) : fallback;
}

export function formatTime(value: DateInput, fallback = "—"): string {
  const date = toDate(value);
  return date
    ? date.toLocaleTimeString(currentLocale(), { hour: "2-digit", minute: "2-digit" })
    : fallback;
}

export function formatNumber(
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {},
  fallback = "—"
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat(currentLocale(), options).format(value);
}

export function formatCurrency(
  value: number | null | undefined,
  currency = "TND",
  options: Intl.NumberFormatOptions = {},
  fallback = "—"
): string {
  return formatNumber(
    value,
    { style: "currency", currency, maximumFractionDigits: 0, ...options },
    fallback
  );
}

/* "il y a 3 jours" / "3 days ago" / "قبل 3 أيام" */
export function formatRelative(value: DateInput, fallback = "—"): string {
  const date = toDate(value);
  if (!date) return fallback;

  const rtf = new Intl.RelativeTimeFormat(currentLocale(), { numeric: "auto" });
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return rtf.format(Math.round(diffSeconds / seconds), unit);
    }
  }

  return rtf.format(diffSeconds, "second");
}
