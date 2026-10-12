// Vérifie la cohérence des traductions.
// Usage : node scripts/check-i18n.mjs  (ou npm run i18n:check)
//  1. fr / en / ar ont exactement les mêmes clés (et aucune valeur vide)
//  2. chaque t("clé") littéral du code existe dans fr
//  3. signale le texte JSX qui ressemble encore à du français codé en dur

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "..", "src");
const LOCALES = path.join(SRC, "i18n", "locales");
const LANGS = ["fr", "en", "ar"];

// Code mort du template TailAdmin, non routé
const IGNORED_DIRS = ["layout", "header", "form", "ui", "features", "i18n"];

function flatten(obj, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") flatten(value, full, out);
    else out[full] = value;
  }
  return out;
}

function loadLang(lng) {
  const dict = JSON.parse(fs.readFileSync(path.join(LOCALES, `${lng}.json`), "utf8"));
  const dir = path.join(LOCALES, lng);
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      dict[file.replace(/\.json$/, "")] = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    }
  }
  return flatten(dict);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const rel = path.relative(SRC, full).split(path.sep);
      if (rel[0] === "components" && IGNORED_DIRS.includes(rel[1])) continue;
      if (IGNORED_DIRS.includes(rel[0])) continue;
      walk(full, files);
    } else if (/\.tsx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

let errors = 0;
const dicts = Object.fromEntries(LANGS.map((l) => [l, loadLang(l)]));
const ref = dicts.fr;

// 1. Parité des clés
for (const lng of LANGS.filter((l) => l !== "fr")) {
  const missing = Object.keys(ref).filter((k) => !(k in dicts[lng]));
  const extra = Object.keys(dicts[lng]).filter((k) => !(k in ref));
  const empty = Object.entries(dicts[lng]).filter(([, v]) => v === "").map(([k]) => k);
  for (const k of missing) console.error(`✗ [${lng}] clé manquante : ${k}`);
  for (const k of extra) console.error(`✗ [${lng}] clé en trop : ${k}`);
  for (const k of empty) console.error(`✗ [${lng}] valeur vide : ${k}`);
  errors += missing.length + extra.length + empty.length;
}

// 2. Clés utilisées dans le code
const prefixes = new Set(
  Object.keys(ref).flatMap((k) => k.split(".").map((_, i, a) => a.slice(0, i + 1).join(".")))
);
const files = walk(SRC);
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  for (const m of src.matchAll(/\bt\(\s*["'`]([\w.-]+)["'`]/g)) {
    const key = m[1];
    if (key.endsWith(".")) continue; // clé construite dynamiquement ("x.y." + variable)
    const isPlural = `${key}_one` in ref || `${key}_other` in ref;
    if (!(key in ref) && !prefixes.has(key) && !isPlural) {
      console.error(`✗ clé inconnue "${key}" dans ${path.relative(SRC, file)}`);
      errors++;
    }
  }
}

// 3. Texte français codé en dur (avertissement)
let warnings = 0;
const FRENCH = /[éèêàùçôîâ]|\b(le|la|les|des|du|une|vos|votre|aucun|projet|équipe|tâche)\b/i;
for (const file of files) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("{/*") || trimmed.startsWith("|")) return;
    const jsxText = line.match(/>([^<>{}]*[A-Za-zÀ-ÿ][^<>{}]*)</);
    const attr = line.match(/\b(placeholder|title|aria-label|alt)="([^"]+)"/);
    const candidate = jsxText?.[1]?.trim() || attr?.[2];
    if (candidate && FRENCH.test(candidate)) {
      console.warn(`⚠ ${path.relative(SRC, file)}:${i + 1}  ${candidate.slice(0, 70)}`);
      warnings++;
    }
  });
}

console.log(
  `\n${Object.keys(ref).length} clés · ${errors} erreur(s) · ${warnings} texte(s) potentiellement non traduit(s)`
);
process.exit(errors ? 1 : 0);
