import fs from 'node:fs';
import { locales } from '../src/i18n/config.ts';
import { translations } from '../src/i18n/translations.ts';

const source = fs.readFileSync(new URL('../src/i18n/translations.ts', import.meta.url), 'utf8');
const allowedEnglish = new Set([
  'meta.title', 'meta.ogTitle', 'nav.paton', 'hero.product', 'system.stage.paton.label', 'system.patonLayer', 'footer.copyright',
  'legal.impressum', 'developmentUpdates.placeholder'
]);
const errors = [];
const englishKeys = Object.keys(translations.en);

const inheritedDictionaries = [...source.matchAll(/const\s+(\w+):\s+TranslationDictionary\s*=\s*\{\s*\.\.\.en,/g)]
  .map((match) => match[1]);
if (inheritedDictionaries.length) {
  errors.push(`localized dictionaries must not inherit English values: ${inheritedDictionaries.join(', ')}`);
}

for (const locale of locales) {
  const dictionary = translations[locale];
  const keys = Object.keys(dictionary);
  if (keys.length !== englishKeys.length) errors.push(`${locale}: expected ${englishKeys.length} keys, found ${keys.length}`);
  for (const key of englishKeys) {
    const value = dictionary[key];
    if (typeof value !== 'string' || !value.trim()) errors.push(`${locale}: empty value for ${key}`);
    if (value?.includes('<span') && (value.match(/<span/g)?.length !== value.match(/<\/span>/g)?.length)) {
      errors.push(`${locale}: unbalanced heading markup for ${key}`);
    }
    if (
      locale !== 'en'
      && value === translations.en[key]
      && !allowedEnglish.has(key)
    ) {
      errors.push(`${locale}: unexpected English fallback for ${key}`);
    }
  }
}

if (errors.length) {
  console.error(`Localization verification failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`Localization verification passed: ${locales.length} locales × ${englishKeys.length} keys.`);
