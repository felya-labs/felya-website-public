import fs from 'node:fs';
import path from 'node:path';
import { localeDetails, locales } from '../src/i18n/config.ts';
import { translations } from '../src/i18n/translations.ts';

const reviewLocales = locales.filter((locale) => locale !== 'en');
const outputDirectory = path.resolve('docs/localization-review');
fs.mkdirSync(outputDirectory, { recursive: true });
const escape = (value) => value.replaceAll('|', '\\|').replaceAll('\n', '<br>').replaceAll('\r', '');

for (const locale of reviewLocales) {
  const lines = [
    `# ${localeDetails[locale].nativeName} localization review`,
    '',
    '> Status: AI-localized draft. Native-speaker review required before the wording is treated as final.',
    '',
    '| Key | English source | Localized copy | Status | Notes |',
    '| --- | --- | --- | --- | --- |'
  ];
  for (const key of Object.keys(translations.en)) {
    lines.push(`| \`${key}\` | ${escape(translations.en[key])} | ${escape(translations[locale][key])} | Native review pending | |`);
  }
  lines.push('');
  fs.writeFileSync(path.join(outputDirectory, `${locale}.md`), lines.join('\n'));
}

console.log(`Generated ${reviewLocales.length} native-review documents in ${outputDirectory}.`);
