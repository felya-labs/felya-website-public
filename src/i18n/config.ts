export const locales = ['en', 'de'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';
export const languageStorageKey = 'felya-labs-language';

export const localeDetails: Record<Locale, {
  nativeName: string;
  shortLabel: string;
  htmlLang: string;
  ogLocale: string;
}> = {
  en: { nativeName: 'English', shortLabel: 'EN', htmlLang: 'en', ogLocale: 'en_US' },
  de: { nativeName: 'Deutsch', shortLabel: 'DE', htmlLang: 'de', ogLocale: 'de_DE' }
};

export const localePath = (locale: Locale) => `/${locale}/`;

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}

export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : defaultLocale;
}
