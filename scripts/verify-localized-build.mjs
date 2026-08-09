import fs from 'node:fs';
import path from 'node:path';
import { localeDetails, localePath, locales } from '../src/i18n/config.ts';
import { translations } from '../src/i18n/translations.ts';

const dist = new URL('../dist/', import.meta.url);
const siteOrigin = process.env.SITE_URL?.trim() || 'https://preview.felya.com';
const errors = [];

const expect = (html, needle, context) => {
  if (!html.includes(needle)) errors.push(`${context}: missing ${needle}`);
};

for (const locale of locales) {
  const file = new URL(`${locale}/index.html`, dist);
  if (!fs.existsSync(file)) {
    errors.push(`${locale}: missing generated route ${path.normalize(file.pathname)}`);
    continue;
  }

  const html = fs.readFileSync(file, 'utf8');
  const dictionary = translations[locale];
  expect(html, `<html lang="${localeDetails[locale].htmlLang}"`, locale);
  expect(html, `<title>${dictionary['meta.title']}</title>`, locale);
  expect(html, `name="description" content="${dictionary['meta.description']}"`, locale);
  expect(html, `rel="canonical" href="${siteOrigin}${localePath(locale)}"`, locale);
  expect(html, `property="og:title" content="${dictionary['meta.ogTitle']}"`, locale);
  expect(html, `name="twitter:description" content="${dictionary['meta.ogDescription']}"`, locale);
  expect(html, dictionary['hero.headlineHands'], locale);

  for (const alternate of locales) {
    expect(html, `hreflang="${localeDetails[alternate].htmlLang}" href="${siteOrigin}${localePath(alternate)}"`, `${locale} hreflang`);
  }
  expect(html, `hreflang="x-default" href="${siteOrigin}/en/"`, `${locale} hreflang`);
}

const rootFile = new URL('index.html', dist);
if (!fs.existsSync(rootFile)) {
  errors.push('root: missing generated locale entry');
} else {
  const root = fs.readFileSync(rootFile, 'utf8');
  expect(root, 'name="robots" content="noindex, follow"', 'root');
  expect(root, 'src="/assets/js/locale-redirect.js"', 'root');
}

const sitemapFile = new URL('sitemap.xml', dist);
const robotsFile = new URL('robots.txt', dist);
if (!fs.existsSync(sitemapFile)) errors.push('search: missing sitemap.xml');
else {
  const sitemap = fs.readFileSync(sitemapFile, 'utf8');
  for (const locale of locales) expect(sitemap, `<loc>${siteOrigin}${localePath(locale)}</loc>`, 'sitemap');
  for (const route of ['/terms/', '/privacy/', '/impressum/']) expect(sitemap, `<loc>${siteOrigin}${route}</loc>`, 'sitemap');
}
if (!fs.existsSync(robotsFile)) errors.push('search: missing robots.txt');
else expect(fs.readFileSync(robotsFile, 'utf8'), `Sitemap: ${siteOrigin}/sitemap.xml`, 'robots');

for (const legalRoute of ['terms', 'privacy', 'impressum']) {
  if (!fs.existsSync(new URL(`${legalRoute}/index.html`, dist))) errors.push(`legal: missing /${legalRoute}/`);
  if (!fs.existsSync(new URL(`${legalRoute}.html`, dist))) errors.push(`legal: missing legacy redirect ${legalRoute}.html`);
}

if (errors.length) {
  console.error(`Localized build verification failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`Localized build verification passed: ${locales.length} language routes, metadata, hreflang, search files and legal routes.`);
