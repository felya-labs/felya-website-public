import { createLegalRedirect } from '../utils/legalRedirect';

export const prerender = true;

export const GET = createLegalRedirect({
  destination: '/impressum/',
  lang: 'de',
  title: 'FELYA',
  linkLabel: 'Weiter'
});
