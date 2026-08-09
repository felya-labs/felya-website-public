import { createLegalRedirect } from '../utils/legalRedirect';

export const prerender = true;

export const GET = createLegalRedirect({
  destination: '/terms/',
  lang: 'en',
  title: 'FELYA',
  linkLabel: 'Continue'
});
