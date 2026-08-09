import impressumRaw from '../content/legal/impressum.txt?raw';
import privacyRaw from '../content/legal/privacy.txt?raw';
import termsRaw from '../content/legal/terms.txt?raw';

function legalPage(slug, lang, pageTitle, rawContent) {
  const normalized = rawContent.trim();
  const [title, ...bodyParts] = normalized.split(/\r?\n\r?\n/);

  return {
    slug,
    lang,
    pageTitle,
    title,
    body: bodyParts.join('\n\n'),
    rawContent: `${normalized}\n`
  };
}

export const legalPages = {
  terms: legalPage('terms', 'en', 'FELYA', termsRaw),
  privacy: legalPage('privacy', 'en', 'FELYA', privacyRaw),
  impressum: legalPage('impressum', 'en', 'FELYA', impressumRaw)
};
