import { createLegalRedirect } from '../utils/legalRedirect';

export const prerender = true;

export const GET = createLegalRedirect({
  destination: '/privacy/',
  lang: 'en',
  title: 'FELYA',
  linkLabel: 'Continue'
});
