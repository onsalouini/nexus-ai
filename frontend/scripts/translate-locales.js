// Script : traduit automatiquement fr.json -> en.json / ar.json via l'API gratuite MyMemory
// Usage : node scripts/translate-locales.js
// Ne traduit QUE les cles manquantes ou nouvelles - ne re-traduit jamais ce qui existe deja
// (pour ne pas ecraser une traduction que tu aurais corrigee manuellement)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, "..", "src", "i18n", "locales");

const TARGET_LANGS = [
  { code: "en", mymemoryCode: "en" },
  { code: "ar", mymemoryCode: "ar" },
];

// Optionnel mais recommande : mets ton email pour passer de 5000 a 50000 mots/jour
const CONTACT_EMAIL = ""; // ex: "ton.email@gmail.com"

function flatten(obj, prefix = "") {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      Object.assign(acc, flatten(value, fullKey));
    } else {
      acc[fullKey] = value;
    }
    return acc;
  }, {});
}

function unflatten(flatObj) {
  const result = {};
  for (const [key, value] of Object.entries(flatObj)) {
    const parts = key.split(".");
    let current = result;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        current[part] = value;
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    });
  }
  return result;
}

async function translateText(text, targetLang) {
  const params = new URLSearchParams({
    q: text,
    langpair: `fr|${targetLang}`,
  });
  if (CONTACT_EMAIL) params.append("de", CONTACT_EMAIL);

  const res = await fetch(`https://api.mymemory.translated.net/get?${params}`);
  const data = await res.json();

  if (data.responseStatus !== 200) {
    console.warn(`  ! Echec traduction pour "${text}" -> ${targetLang}, garde le francais`);
    return text;
  }
  return data.responseData.translatedText;
}

async function main() {
  const frPath = path.join(LOCALES_DIR, "fr.json");
  const frContent = JSON.parse(fs.readFileSync(frPath, "utf-8"));
  const frFlat = flatten(frContent);

  for (const { code, mymemoryCode } of TARGET_LANGS) {
    const targetPath = path.join(LOCALES_DIR, `${code}.json`);
    const existing = fs.existsSync(targetPath)
      ? JSON.parse(fs.readFileSync(targetPath, "utf-8"))
      : {};
    const existingFlat = flatten(existing);

    console.log(`\n=== Traduction vers ${code} ===`);
    let translatedCount = 0;

    for (const [key, frText] of Object.entries(frFlat)) {
      if (existingFlat[key]) continue; // deja traduit, on ne touche pas

      const translated = await translateText(frText, mymemoryCode);
      existingFlat[key] = translated;
      translatedCount++;
      console.log(`  + ${key}: "${frText}" -> "${translated}"`);

      // petite pause pour rester sympa avec l'API gratuite
      await new Promise((r) => setTimeout(r, 300));
    }

    const finalContent = unflatten(existingFlat);
    fs.writeFileSync(targetPath, JSON.stringify(finalContent, null, 2), "utf-8");
    console.log(`${translatedCount} nouvelle(s) traduction(s) ecrite(s) dans ${code}.json`);
  }

  console.log("\nTerminé.");
}

main();