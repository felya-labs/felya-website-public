export const mobileNavigation = {
  selectors: { container: 'header details.mobile-navigation', links: 'a' }
};

export const colorTheme = {
  storageKey: 'felya-labs-theme',
  defaultTheme: 'light',
  themes: ['dark', 'light'],
  selectors: { buttons: '[data-theme-toggle]' }
};

export const language = {
  storageKey: 'felya-labs-language',
  defaultLanguage: 'en',
  languages: ['en', 'de'],
  selectors: {
    openButtons: '[data-language-open]',
    closeButtons: '[data-language-close]',
    dialog: '[data-language-dialog]',
    options: '[data-language-option]'
  }
};

export const developmentUpdatesFormConfig = {
  selectors: {
    form: '#development-updates-form',
    email: 'input[name="email"]',
    submit: 'button[type="submit"]',
    status: '#development-updates-status'
  },
  request: {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'omit',
    referrerPolicy: 'no-referrer'
  }
};

export const prototypeVideoCover = {
  selectors: { cover: '[data-video-cover]' }
};
