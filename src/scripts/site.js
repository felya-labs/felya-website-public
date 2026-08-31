import {
  colorTheme,
  prototypeVideoCover,
  language,
  mobileNavigation,
  developmentUpdatesFormConfig
} from './site-config.js';
import {
  priorityHeroLanguages,
  secondaryHeroLanguages
} from './hero-headline-translations.js';
import {
  heroEarthSegments,
  heroEarthRotationParams
} from '../data/hero-earth-coastline.js';

export {
  colorTheme,
  prototypeVideoCover,
  language,
  mobileNavigation,
  developmentUpdatesFormConfig
} from './site-config.js';

export function getActiveLanguage(config = language) {
  const currentLanguage = document.documentElement.dataset.language;
  return config.languages.includes(currentLanguage) ? currentLanguage : config.defaultLanguage;
}

let activeTranslations;
export function translate(key) {
  if (!activeTranslations) {
    const source = document.querySelector('#felya-i18n')?.dataset.translations;
    try { activeTranslations = source ? JSON.parse(source) : {}; } catch { activeTranslations = {}; }
  }
  return activeTranslations[key] ?? key;
}

export function onDocumentReady(callback) {
  if (typeof document === 'undefined') return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }

  callback();
}

export function initColorTheme({ root = document, config = colorTheme } = {}) {
  const buttons = Array.from(root.querySelectorAll(config.selectors.buttons));
  if (!buttons.length) return;

  const isValidTheme = (theme) => config.themes.includes(theme);

  const readStoredTheme = () => {
    try {
      const storedTheme = window.localStorage.getItem(config.storageKey);
      if (isValidTheme(storedTheme)) return storedTheme;
    } catch {
      // The early theme initializer already provides the automatic fallback.
    }

    const initialTheme = document.documentElement.dataset.theme;
    return isValidTheme(initialTheme) ? initialTheme : config.defaultTheme;
  };

  const persistTheme = (theme) => {
    try {
      window.localStorage.setItem(config.storageKey, theme);
    } catch {}
  };

  const applyTheme = (theme, shouldPersist = true) => {
    const nextTheme = isValidTheme(theme) ? theme : config.defaultTheme;
    const nextAction = nextTheme === 'dark' ? 'light' : 'dark';
    const labelKey = nextAction === 'light' ? 'theme.toLight' : 'theme.toDark';
    document.documentElement.dataset.theme = nextTheme;
    if (shouldPersist) document.documentElement.dataset.themeSource = 'user';
    buttons.forEach((button) => {
      button.dataset.themeNext = nextAction;
      button.setAttribute('aria-pressed', String(nextTheme === 'light'));
      button.setAttribute('aria-label', translate(labelKey));
    });
    if (shouldPersist) persistTheme(nextTheme);
    document.dispatchEvent(new CustomEvent('felya:themechange', {
      detail: {
        theme: nextTheme,
        userInitiated: shouldPersist
      }
    }));
  };

  applyTheme(readStoredTheme(), false);

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextTheme = button.dataset.themeNext || (document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
      applyTheme(nextTheme);
    });
  });

  document.addEventListener('felya:languagechange', () => {
    applyTheme(document.documentElement.dataset.theme, false);
  });
}

export function initLanguageSelector({ root = document, config = language } = {}) {
  const dialog = root.querySelector(config.selectors.dialog);
  const openButtons = Array.from(root.querySelectorAll(config.selectors.openButtons));
  if (!dialog || !openButtons.length) return;

  let opener = null;
  const open = (button) => {
    opener = button;
    dialog.showModal();
    dialog.querySelector('[aria-current="page"]')?.focus();
  };
  const close = () => {
    dialog.close();
    opener?.focus();
  };

  openButtons.forEach((button) => button.addEventListener('click', () => open(button)));
  dialog.querySelectorAll(config.selectors.closeButtons).forEach((button) => button.addEventListener('click', close));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', () => opener?.focus());

  dialog.querySelectorAll(config.selectors.options).forEach((option) => {
    option.addEventListener('click', () => {
      const nextLanguage = option.dataset.languageOption;
      try { window.localStorage.setItem(config.storageKey, nextLanguage); } catch {}
      if (window.location.hash) option.href = `${option.href}${window.location.hash}`;
    });
  });
}

export function initThemeImages({ root = document } = {}) {
  const images = Array.from(root.querySelectorAll('[data-theme-image]'));
  if (!images.length) return;

  const applySources = () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    images.forEach((image) => {
      const nextSource = theme === 'dark' ? image.dataset.darkSrc : image.dataset.lightSrc;
      const nextSourceSet = theme === 'dark' ? image.dataset.darkSrcset : image.dataset.lightSrcset;
      if (nextSourceSet && image.getAttribute('srcset') !== nextSourceSet) image.setAttribute('srcset', nextSourceSet);
      if (nextSource && image.getAttribute('src') !== nextSource) image.setAttribute('src', nextSource);
    });
  };

  applySources();
  document.addEventListener('felya:themechange', applySources);
}

export function initHeroProductThemeTransition({ root = document } = {}) {
  const composites = Array.from(root.querySelectorAll('[data-hero-product-composite]'));
  if (!composites.length) return;

  const applyGloveTheme = (theme) => {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    composites.forEach((composite) => {
      composite.dataset.gloveTheme = nextTheme;
    });
  };

  applyGloveTheme(document.documentElement.dataset.theme);

  document.addEventListener('felya:themechange', (event) => {
    const nextTheme = event.detail?.theme || document.documentElement.dataset.theme;
    applyGloveTheme(nextTheme);
  });
}

export function initTwoLineHeadings({ root = document } = {}) {
  const headings = Array.from(root.querySelectorAll([
    '.section-title',
    '.point-of-view-title',
    '.development-updates-title',
    '.contact-title',
    '.future-scenario__copy h3'
  ].join(', ')));
  if (!headings.length) return;

  let frame = 0;

  const fitsTwoLines = (heading) => {
    const styles = window.getComputedStyle(heading);
    const lineHeight = Number.parseFloat(styles.lineHeight);
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) return true;
    const hasControlledLines = heading.querySelectorAll(':scope > .heading-line').length === 2;
    return (hasControlledLines || heading.scrollHeight <= (lineHeight * 2) + 4)
      && heading.scrollWidth <= heading.clientWidth + 1;
  };

  const fitHeading = (heading) => {
    heading.style.removeProperty('font-size');
    const naturalSize = Number.parseFloat(window.getComputedStyle(heading).fontSize);
    if (!Number.isFinite(naturalSize) || fitsTwoLines(heading)) return;

    let lower = Math.min(14, naturalSize);
    let upper = naturalSize;

    for (let index = 0; index < 10; index += 1) {
      const candidate = (lower + upper) / 2;
      heading.style.fontSize = `${candidate}px`;
      if (fitsTwoLines(heading)) lower = candidate;
      else upper = candidate;
    }

    heading.style.fontSize = `${lower}px`;
  };

  const fitAll = () => {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => headings.forEach(fitHeading));
  };

  fitAll();
  document.fonts?.ready.then(fitAll);
  window.addEventListener('resize', fitAll, { passive: true });
  document.addEventListener('felya:languagechange', fitAll);
}

export function initMobileNavigation({ root = document, config = mobileNavigation } = {}) {
  const container = root.querySelector(config.selectors.container);
  if (!container) return;

  const toggle = container.querySelector('summary');
  const syncExpandedState = () => {
    toggle?.setAttribute('aria-expanded', String(container.open));
  };

  syncExpandedState();
  container.addEventListener('toggle', syncExpandedState);

  container.querySelectorAll(config.selectors.links).forEach((link) => {
    link.addEventListener('click', () => {
      container.removeAttribute('open');
    });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!container.open) return;
    if (container.contains(event.target)) return;

    container.removeAttribute('open');
  }, { capture: true });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !container.open) return;

    container.removeAttribute('open');
  });
}

export function initHeroHeadlineLanguages({
  root = document,
  priority = priorityHeroLanguages,
  secondary = secondaryHeroLanguages,
  random = Math.random,
  idleTimings = {}
} = {}) {
  const hitbox = root.querySelector('[data-hero-headline-languages]');
  const headline = hitbox?.querySelector('.hero-headline-language-text');
  if (!hitbox || !headline || !priority.length || !secondary.length) return;

  hitbox.__felyaHeroHeadlineCleanup?.();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timings = {
    firstIdleDelay: 12000,
    idleDelayMin: 16000,
    idleDelayMax: 24000,
    longIdleDelayMin: 35000,
    longIdleDelayMax: 50000,
    languageHoldMin: 2000,
    languageHoldMax: 2600,
    ...idleTimings
  };
  const shuffle = (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  };

  const englishLanguage = priority.find((entry) => entry.code === 'en');
  let priorityQueue = [];
  let secondaryQueue = [];
  let shouldShowEnglishFirst = false;
  let isEasterEggActive = false;
  let isPointerInside = false;
  let isFocused = false;
  let touchTapCount = 0;
  let ignoreTouchClickUntil = 0;
  let introRunId = 0;
  let isIntroActive = false;
  let transitionRunId = 0;
  let previewRunId = 0;
  let isPointerPreviewRunning = false;
  let idleRunId = 0;
  let automaticChangeCount = 0;
  let lastAutomaticLanguageCode = '';
  let lastPointerPreviewLanguageCode = '';
  let interactionState = 'intro';
  let isDestroyed = false;
  const timers = new Map();
  const listeners = [];

  const setState = (state) => {
    interactionState = state;
    hitbox.dataset.heroLanguageState = state;
  };

  const randomBetween = (minimum, maximum) => minimum + (random() * (maximum - minimum));

  const wait = (duration, group) => new Promise((resolve) => {
    const timerId = window.setTimeout(() => {
      timers.delete(timerId);
      resolve(true);
    }, duration);
    timers.set(timerId, { group, resolve });
  });

  const cancelTimers = (group) => {
    timers.forEach((timer, timerId) => {
      if (group && timer.group !== group) return;
      window.clearTimeout(timerId);
      timers.delete(timerId);
      timer.resolve(false);
    });
  };

  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  };

  const resetLanguageCycle = () => {
    const defaultText = translate(headline.dataset.i18n);
    shouldShowEnglishFirst = Boolean(englishLanguage && defaultText !== englishLanguage.text);
    priorityQueue = shuffle(priority).filter((entry) => (
      entry.text !== defaultText
      && (!shouldShowEnglishFirst || entry.code !== englishLanguage.code)
    ));
    secondaryQueue = shuffle(secondary).filter((entry) => entry.text !== defaultText);
  };

  resetLanguageCycle();

  const fitHeadline = () => {
    headline.style.removeProperty('--hero-headline-scale');
    const availableWidth = hitbox.clientWidth;
    const contentWidth = headline.scrollWidth;
    const scale = availableWidth > 0 && contentWidth > availableWidth
      ? availableWidth / contentWidth
      : 1;
    headline.style.setProperty('--hero-headline-scale', String(scale));
  };

  const restoreHeadline = () => {
    headline.textContent = translate(headline.dataset.i18n);
    headline.removeAttribute('lang');
    headline.removeAttribute('dir');
    headline.removeAttribute('data-hero-language');
    fitHeadline();
  };

  const restoreEnglishHeadline = () => {
    if (!englishLanguage) {
      restoreHeadline();
      return;
    }

    headline.textContent = englishLanguage.text;
    headline.lang = englishLanguage.code;
    headline.dir = englishLanguage.dir || 'ltr';
    headline.dataset.heroLanguage = englishLanguage.name;
    fitHeadline();
  };

  const nextLanguage = () => {
    if (shouldShowEnglishFirst) {
      shouldShowEnglishFirst = false;
      return englishLanguage;
    }
    if (priorityQueue.length) return priorityQueue.shift();
    if (!secondaryQueue.length) {
      const defaultText = translate(headline.dataset.i18n);
      secondaryQueue = shuffle(secondary).filter((entry) => entry.text !== defaultText);
    }
    return secondaryQueue.shift();
  };

  const showNextLanguage = () => {
    let languageEntry = nextLanguage();
    const defaultText = translate(headline.dataset.i18n);
    if (languageEntry?.text === defaultText) languageEntry = nextLanguage();
    if (!languageEntry) return;

    headline.textContent = languageEntry.text;
    headline.lang = languageEntry.code;
    headline.dir = languageEntry.dir || 'ltr';
    headline.dataset.heroLanguage = languageEntry.name;
    fitHeadline();
  };

  const nextAutomaticLanguage = () => {
    const maximumAttempts = priority.length + secondary.length + 2;
    for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
      const entry = nextLanguage();
      if (!entry || entry.code === lastAutomaticLanguageCode) continue;
      return entry;
    }
    return null;
  };

  const nextPointerPreviewLanguage = () => {
    const defaultText = translate(headline.dataset.i18n);
    const maximumAttempts = priority.length + secondary.length + 2;
    for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
      const entry = nextLanguage();
      if (!entry || entry.text === defaultText || entry.code === lastPointerPreviewLanguageCode) continue;
      return entry;
    }
    return null;
  };

  const cancelHeadlineTransition = () => {
    transitionRunId += 1;
    cancelTimers('transition');
    headline.classList.remove('hero-headline-language-text--intro-in', 'hero-headline-language-text--intro-out');
    hitbox.classList.remove('hero-headline-language-hitbox--idle-transition');
    if (!isIntroActive) hitbox.classList.remove('hero-headline-language-hitbox--animating');
  };

  const transitionHeadline = async (updateHeadline, { idle = false } = {}) => {
    cancelHeadlineTransition();

    if (reduceMotion.matches) {
      updateHeadline();
      return true;
    }

    const runId = ++transitionRunId;
    hitbox.classList.add('hero-headline-language-hitbox--animating');
    hitbox.classList.toggle('hero-headline-language-hitbox--idle-transition', idle);
    headline.classList.add('hero-headline-language-text--intro-out');

    if (!await wait(idle ? 130 : 140, 'transition') || runId !== transitionRunId) return false;

    updateHeadline();
    headline.classList.remove('hero-headline-language-text--intro-out');
    headline.classList.add('hero-headline-language-text--intro-in');

    if (!await wait(idle ? 190 : 210, 'transition') || runId !== transitionRunId) return false;

    headline.classList.remove('hero-headline-language-text--intro-in');
    hitbox.classList.remove('hero-headline-language-hitbox--animating');
    hitbox.classList.remove('hero-headline-language-hitbox--idle-transition');
    return true;
  };

  const showEasterEgg = () => {
    isEasterEggActive = true;
    setState('easter-egg');
    headline.textContent = 'Beyond Earth. ✨';
    headline.lang = 'en';
    headline.dir = 'ltr';
    headline.dataset.heroLanguage = 'Easter egg';
    fitHeadline();
  };

  const cancelIntro = () => {
    introRunId += 1;
    cancelTimers('intro');
    headline.classList.remove('hero-headline-language-text--intro-in', 'hero-headline-language-text--intro-out');
    hitbox.classList.remove('hero-headline-language-hitbox--animating');
    if (isIntroActive) restoreHeadline();
    isIntroActive = false;
  };

  const cancelIdle = () => {
    idleRunId += 1;
    cancelTimers('idle');
  };

  const cancelPreview = () => {
    previewRunId += 1;
    isPointerPreviewRunning = false;
    cancelTimers('preview');
  };

  const canRunIdle = () => (
    !isDestroyed
    && !reduceMotion.matches
    && !document.hidden
    && !isIntroActive
    && !isEasterEggActive
    && !isPointerInside
    && !isFocused
  );

  let scheduleIdle;

  const runIdleChange = async (runId) => {
    if (runId !== idleRunId || !canRunIdle()) return;

    const languageEntry = nextAutomaticLanguage();
    if (!languageEntry) {
      scheduleIdle(randomBetween(timings.idleDelayMin, timings.idleDelayMax));
      return;
    }

    setState('idle-active');
    lastAutomaticLanguageCode = languageEntry.code;
    const didShowLanguage = await transitionHeadline(() => {
      headline.textContent = languageEntry.text;
      headline.lang = languageEntry.code;
      headline.dir = languageEntry.dir || 'ltr';
      headline.dataset.heroLanguage = languageEntry.name;
      fitHeadline();
    }, { idle: true });
    if (!didShowLanguage || runId !== idleRunId || !canRunIdle()) return;

    if (!await wait(randomBetween(timings.languageHoldMin, timings.languageHoldMax), 'idle')) return;
    if (runId !== idleRunId || !canRunIdle()) return;

    const didRestore = await transitionHeadline(restoreHeadline, { idle: true });
    if (!didRestore || runId !== idleRunId || !canRunIdle()) return;

    automaticChangeCount += 1;
    const shouldTakeLongPause = automaticChangeCount >= 3;
    if (shouldTakeLongPause) automaticChangeCount = 0;
    setState('idle-waiting');
    scheduleIdle(randomBetween(
      shouldTakeLongPause ? timings.longIdleDelayMin : timings.idleDelayMin,
      shouldTakeLongPause ? timings.longIdleDelayMax : timings.idleDelayMax
    ));
  };

  scheduleIdle = (delay) => {
    cancelIdle();
    if (!canRunIdle()) return;
    setState('idle-waiting');
    const runId = idleRunId;
    wait(delay, 'idle').then((completed) => {
      if (completed) runIdleChange(runId);
    });
  };

  const scheduleNormalIdle = () => {
    scheduleIdle(randomBetween(timings.idleDelayMin, timings.idleDelayMax));
  };

  const claimManualInteraction = () => {
    cancelIdle();
    cancelHeadlineTransition();
    if (!isEasterEggActive) setState('interaction');
  };

  const showLanguageEntry = (languageEntry) => {
    if (!languageEntry) return;
    headline.textContent = languageEntry.text;
    headline.lang = languageEntry.code;
    headline.dir = languageEntry.dir || 'ltr';
    headline.dataset.heroLanguage = languageEntry.name;
    fitHeadline();
  };

  const runPointerPreview = async () => {
    cancelPreview();
    const runId = previewRunId;
    isPointerPreviewRunning = true;
    const languageEntry = nextPointerPreviewLanguage();
    if (!languageEntry) {
      isPointerPreviewRunning = false;
      return;
    }

    const didShowLanguage = await transitionHeadline(() => {
      showLanguageEntry(languageEntry);
      lastPointerPreviewLanguageCode = languageEntry.code;
    });
    if (!didShowLanguage || runId !== previewRunId) {
      if (runId === previewRunId) isPointerPreviewRunning = false;
      return;
    }

    isPointerPreviewRunning = false;
    if (isPointerInside || isEasterEggActive) return;

    if (!await wait(40, 'preview') || runId !== previewRunId) return;
    await transitionHeadline(restoreHeadline);
    if (runId === previewRunId) scheduleNormalIdle();
  };

  const runThemePreview = async () => {
    if (isEasterEggActive) return;

    cancelIntro();
    cancelPreview();
    claimManualInteraction();
    const runId = previewRunId;
    const defaultText = translate(headline.dataset.i18n);
    let languageEntry = nextAutomaticLanguage();
    let attempts = priority.length + secondary.length;
    while (languageEntry?.text === defaultText && attempts > 0) {
      languageEntry = nextAutomaticLanguage();
      attempts -= 1;
    }
    if (!languageEntry) return;

    const didShowLanguage = await transitionHeadline(() => showLanguageEntry(languageEntry));
    if (!didShowLanguage || runId !== previewRunId) return;
    if (!await wait(40, 'preview') || runId !== previewRunId || isEasterEggActive) return;

    await transitionHeadline(restoreHeadline);
    if (runId === previewRunId) scheduleNormalIdle();
  };

  const playIntro = async (introLanguages) => {
    const runId = ++introRunId;
    if (!introLanguages.length) return;

    hitbox.classList.add('hero-headline-language-hitbox--animating');

    const waitForIntro = async (duration) => (
      await wait(duration, 'intro') && runId === introRunId
    );

    for (const entry of introLanguages) {
      headline.classList.add('hero-headline-language-text--intro-out');
      if (!await waitForIntro(140)) return;

      headline.textContent = entry.text;
      headline.lang = entry.code;
      headline.dir = entry.dir || 'ltr';
      headline.dataset.heroLanguage = entry.name;
      fitHeadline();
      headline.classList.remove('hero-headline-language-text--intro-out');
      headline.classList.add('hero-headline-language-text--intro-in');
      if (!await waitForIntro(210)) return;
      headline.classList.remove('hero-headline-language-text--intro-in');
      if (!await waitForIntro(40)) return;
    }

    headline.classList.add('hero-headline-language-text--intro-out');
    if (!await waitForIntro(140)) return;
    restoreHeadline();
    headline.classList.remove('hero-headline-language-text--intro-out');
    headline.classList.add('hero-headline-language-text--intro-in');
    if (!await waitForIntro(230)) return;
    headline.classList.remove('hero-headline-language-text--intro-in');
    hitbox.classList.remove('hero-headline-language-hitbox--animating');
    isIntroActive = false;
    setState('idle-waiting');
    scheduleIdle(timings.firstIdleDelay);
  };

  const scheduleIntro = async () => {
    if (reduceMotion.matches) {
      hitbox.removeAttribute('data-hero-intro-pending');
      restoreHeadline();
      setState('interaction');
      return;
    }

    const defaultText = translate(headline.dataset.i18n);
    const eligibleLanguage = (entry) => entry.text !== defaultText;
    const introLanguages = shuffle([
      ...priority,
      ...secondary
    ].filter(eligibleLanguage)).slice(0, 3);
    if (!introLanguages.length) {
      hitbox.removeAttribute('data-hero-intro-pending');
      isIntroActive = false;
      scheduleIdle(timings.firstIdleDelay);
      return;
    }

    const firstLanguage = introLanguages.shift();
    headline.textContent = firstLanguage.text;
    headline.lang = firstLanguage.code;
    headline.dir = firstLanguage.dir || 'ltr';
    headline.dataset.heroLanguage = firstLanguage.name;
    isIntroActive = true;
    const runId = introRunId;
    fitHeadline();
    hitbox.removeAttribute('data-hero-intro-pending');

    await document.fonts?.ready;
    if (runId !== introRunId || isDestroyed) return;
    fitHeadline();
    if (await wait(600, 'intro') && runId === introRunId) playIntro(introLanguages);
  };

  const handleStandardActivation = async () => {
    cancelPreview();
    claimManualInteraction();
    if (isEasterEggActive) {
      isEasterEggActive = false;
      setState('interaction');
      await transitionHeadline(restoreHeadline);
      resetLanguageCycle();
      scheduleNormalIdle();
      return;
    }
    await transitionHeadline(showNextLanguage);
    scheduleNormalIdle();
  };

  const handlePointerDown = () => {
    cancelIntro();
    claimManualInteraction();
  };
  const handlePointerEnter = (event) => {
    if (event.pointerType === 'touch') return;
    isPointerInside = true;
    cancelIntro();
    claimManualInteraction();
    if (isEasterEggActive) return;
    runPointerPreview();
  };
  const handlePointerLeave = async (event) => {
    if (event.pointerType === 'touch') return;
    isPointerInside = false;
    if (isEasterEggActive) return;
    if (isPointerPreviewRunning) return;
    cancelPreview();
    claimManualInteraction();
    await transitionHeadline(restoreHeadline);
    scheduleNormalIdle();
  };
  const handlePointerUp = (event) => {
    if (event.pointerType !== 'touch') return;

    claimManualInteraction();
    ignoreTouchClickUntil = performance.now() + 700;
    touchTapCount += 1;
    cancelTimers('touch');

    if (touchTapCount === 1) handleStandardActivation();
    if (touchTapCount === 3) {
      transitionHeadline(showEasterEgg);
      touchTapCount = 0;
      return;
    }

    wait(500, 'touch').then((completed) => {
      if (completed) touchTapCount = 0;
    });
  };
  const handleClick = (event) => {
    if (performance.now() < ignoreTouchClickUntil) return;
    if (event.detail === 3) {
      claimManualInteraction();
      transitionHeadline(showEasterEgg);
      return;
    }
    if (event.detail > 1) return;
    handleStandardActivation();
  };
  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    cancelIntro();
    claimManualInteraction();
    event.preventDefault();
    handleStandardActivation();
  };
  const handleFocus = () => {
    isFocused = true;
    cancelIntro();
    claimManualInteraction();
  };
  const handleBlur = () => {
    isFocused = false;
    if (!isEasterEggActive) scheduleNormalIdle();
  };
  // Always refit, not just while an intro/cycling language is showing: the resting default
  // headline needs this too whenever the hitbox's available width changes for any reason (a
  // window resize, a devtools viewport-dimension switch, an orientation change) -- gating this
  // on dataset.heroLanguage left the resting text's scale stuck at whatever it was computed as
  // on the very first fit, however that number came about.
  const handleResize = () => fitHeadline();
  const handleLanguageChange = () => {
    if (!isEasterEggActive) {
      cancelPreview();
      cancelIntro();
      cancelIdle();
      cancelHeadlineTransition();
      restoreHeadline();
      resetLanguageCycle();
      setState('intro');
      scheduleIntro();
    }
  };
  const handleThemeChange = (event) => {
    if (!event.detail?.userInitiated) return;
    runThemePreview();
  };
  const handleDocumentPointerDown = (event) => {
    if (isEasterEggActive || hitbox.contains(event.target)) return;

    if (document.activeElement === hitbox) hitbox.blur();
    isFocused = false;
    cancelIntro();
    claimManualInteraction();
    transitionHeadline(restoreEnglishHeadline).then(scheduleNormalIdle);
  };
  const handleVisibilityChange = () => {
    cancelIdle();
    if (document.hidden) {
      if (isIntroActive) cancelIntro();
      if (interactionState === 'idle-active') {
        cancelHeadlineTransition();
        restoreEnglishHeadline();
      }
      return;
    }
    if (!isEasterEggActive) scheduleNormalIdle();
  };
  const handleReducedMotionChange = () => {
    cancelIdle();
    if (reduceMotion.matches && interactionState === 'idle-active') {
      cancelHeadlineTransition();
      restoreEnglishHeadline();
      setState('interaction');
      return;
    }
    if (!reduceMotion.matches && !isEasterEggActive) scheduleNormalIdle();
  };

  listen(hitbox, 'selectstart', (event) => event.preventDefault());
  listen(hitbox, 'pointerdown', handlePointerDown);
  listen(hitbox, 'pointerenter', handlePointerEnter);
  listen(hitbox, 'pointerleave', handlePointerLeave);
  listen(hitbox, 'pointerup', handlePointerUp);
  listen(hitbox, 'click', handleClick);
  listen(hitbox, 'keydown', handleKeyDown);
  listen(hitbox, 'focus', handleFocus);
  listen(hitbox, 'blur', handleBlur);
  listen(window, 'resize', handleResize, { passive: true });
  listen(document, 'felya:languagechange', handleLanguageChange);
  listen(document, 'felya:themechange', handleThemeChange);
  listen(document, 'pointerdown', handleDocumentPointerDown);
  listen(document, 'visibilitychange', handleVisibilityChange);
  reduceMotion.addEventListener?.('change', handleReducedMotionChange);

  // Belt-and-suspenders alongside the resize listener above: a window resize is only one way
  // the hitbox's available width can change. A ResizeObserver also catches a font swap reflowing
  // the line, a sibling layout shift, or a breakpoint's width cap kicking in at a size no
  // window-level resize event fires for (e.g. a devtools device-toolbar switch that changes the
  // viewport without the page navigating). Doesn't loop: fitHeadline only ever writes a
  // transform on .hero-headline-language-text, which doesn't feed back into hitbox's own size.
  const hitboxResizeObserver = 'ResizeObserver' in window ? new ResizeObserver(() => fitHeadline()) : null;
  hitboxResizeObserver?.observe(hitbox);

  const cleanup = () => {
    isDestroyed = true;
    cancelPreview();
    cancelTimers();
    listeners.splice(0).forEach((removeListener) => removeListener());
    reduceMotion.removeEventListener?.('change', handleReducedMotionChange);
    hitboxResizeObserver?.disconnect();
    cancelHeadlineTransition();
    hitbox.classList.remove('hero-headline-language-hitbox--animating', 'hero-headline-language-hitbox--idle-transition');
    hitbox.removeAttribute('data-hero-language-state');
    if (hitbox.__felyaHeroHeadlineCleanup === cleanup) delete hitbox.__felyaHeroHeadlineCleanup;
  };
  hitbox.__felyaHeroHeadlineCleanup = cleanup;
  listen(window, 'pagehide', cleanup, { once: true });

  fitHeadline();
  // Independent of whichever branch scheduleIntro() below takes (e.g. it skips its own
  // fonts.ready wait entirely under prefers-reduced-motion): refit once webfonts are actually
  // loaded, since the very first fitHeadline() call above may have measured against fallback
  // font metrics.
  document.fonts?.ready.then(() => { if (!isDestroyed) fitHeadline(); });
  setState('intro');
  scheduleIntro();
}

export function setDevelopmentUpdatesStatus(statusElement, message, state = 'idle') {
  if (!statusElement) return;

  statusElement.textContent = message;
  statusElement.dataset.state = state;
}

export function initDevelopmentUpdatesForm({ root = document, config = developmentUpdatesFormConfig } = {}) {
  const form = root.querySelector(config.selectors.form);
  if (!form) return;

  const emailInput = form.querySelector(config.selectors.email);
  const submitButton = form.querySelector(config.selectors.submit);
  const status = root.querySelector(config.selectors.status);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!emailInput || !submitButton || !status) return;
    if (!form.reportValidity()) return;

    submitButton.disabled = true;
    form.setAttribute('aria-busy', 'true');
    submitButton.textContent = translate('developmentUpdates.pendingButton');
    setDevelopmentUpdatesStatus(status, translate('developmentUpdates.pendingStatus'), 'idle');

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(form.action, {
        ...config.request,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        form.reset();
        setDevelopmentUpdatesStatus(status, form.dataset.successMessage, 'success');
      } else {
        setDevelopmentUpdatesStatus(status, form.dataset.errorMessage, 'error');
      }
    } catch {
      setDevelopmentUpdatesStatus(status, form.dataset.errorMessage, 'error');
    } finally {
      submitButton.disabled = false;
      form.removeAttribute('aria-busy');
      submitButton.textContent = submitButton.dataset.label || translate('developmentUpdates.fallbackButton');
    }
  });
}

export function initPrototypeVideoCover({ root = document, config = prototypeVideoCover } = {}) {
  const covers = Array.from(root.querySelectorAll(config.selectors.cover));
  if (!covers.length) return;

  const loadVideoSources = (video) => {
    if (video.dataset.videoLoaded === 'true') return;

    video.querySelectorAll('source[data-src]').forEach((source) => {
      source.src = source.dataset.src;
      delete source.dataset.src;
    });
    video.dataset.videoLoaded = 'true';
    video.load();
  };

  covers.forEach((cover) => {
    const targetId = cover.dataset.videoTarget;
    const video = targetId ? document.getElementById(targetId) : cover.parentElement?.querySelector('video');
    if (!video) return;
    const frame = cover.closest('[data-video-frame]');
    const label = cover.querySelector('[data-video-play-label]');
    const playAriaLabel = cover.getAttribute('aria-label');
    const replayAriaLabel = cover.dataset.videoReplayLabel || playAriaLabel;

    const hideCover = () => {
      cover.hidden = true;
      frame?.setAttribute('data-video-state', 'playing');
    };

    const showCover = () => {
      video.pause();
      video.currentTime = 0;
      frame?.setAttribute('data-video-state', 'ready');
      cover.setAttribute('aria-label', replayAriaLabel);
      if (label) label.textContent = translate('prototypes.replayButton');
      cover.hidden = false;
    };

    frame?.setAttribute('data-video-state', 'ready');
    cover.setAttribute('aria-label', playAriaLabel);
    cover.hidden = false;
    cover.addEventListener('click', () => {
      loadVideoSources(video);
      frame?.setAttribute('data-video-state', 'loading');
      const playRequest = video.play();
      if (playRequest) {
        playRequest.catch(() => {
          frame?.setAttribute('data-video-state', 'ready');
          cover.hidden = false;
        });
      }
    });
    video.addEventListener('playing', hideCover);
    video.addEventListener('ended', showCover);
  });
}

export function initPrototypeFilmViewport({ root = document } = {}) {
  const stages = Array.from(root.querySelectorAll('.prototypes-film-stage'));
  if (!stages.length) return;

  stages.forEach((stage) => {
    stage.__felyaPrototypeFilmCleanup?.();

    const setActive = (active) => {
      stage.toggleAttribute('data-film-active', active);
    };

    if (!('IntersectionObserver' in window)) {
      setActive(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === stage) setActive(entry.isIntersecting);
      });
    }, {
      rootMargin: '-28% 0px -28% 0px',
      threshold: 0.01
    });

    const cleanup = () => {
      observer.disconnect();
      stage.removeAttribute('data-film-active');
      if (stage.__felyaPrototypeFilmCleanup === cleanup) delete stage.__felyaPrototypeFilmCleanup;
    };

    stage.__felyaPrototypeFilmCleanup = cleanup;
    observer.observe(stage);
  });
}

export function initHeroMobileGloveScroll({ root = document } = {}) {
  const stages = Array.from(root.querySelectorAll('.hero-mobile-glove-stage'));
  if (!stages.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = null;

  const reset = () => {
    stages.forEach((stage) => {
      stage.style.removeProperty('--hero-glove-y');
    });

    root.querySelectorAll('.hero-scroll-glove').forEach((glove) => {
      glove.style.removeProperty('transform');
    });
  };

  const update = () => {
    frame = null;

    if (reduceMotion.matches || window.innerWidth >= 768) {
      reset();
      return;
    }

    const travel = Math.min(360, window.innerHeight * 0.48);
    const progress = Math.min(Math.max(window.scrollY / travel, 0), 1);
    const offsetY = progress * -4;

    stages.forEach((stage) => {
      stage.style.setProperty('--hero-glove-y', `${offsetY.toFixed(2)}px`);
    });
  };

  const requestUpdate = () => {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  reduceMotion.addEventListener?.('change', requestUpdate);
}

export function initHeroCopyAlignment({ root = document } = {}) {
  const wrap = root.querySelector('.hero-copy-align');
  const glove = root.querySelector('.hero-product-composite');
  const line = root.querySelector('.hero-headline-language-hitbox');
  if (!wrap || !glove || !line) return;

  // Measured on the source photo: the web between the thumb and index finger sits at ~50% of
  // the image's own height. Only meaningful in the desktop two-column layout (glove and headline
  // are stacked, not side by side, below 1024px, so there's no "level with the glove" to keep).
  const GLOVE_THUMB_INDEX_GAP_FRACTION = 0.5;
  const desktopQuery = window.matchMedia('(min-width: 1024px)');

  let frame = null;

  function align() {
    frame = null;
    if (!desktopQuery.matches) {
      wrap.style.removeProperty('--hero-copy-align-shift');
      return;
    }
    // Reset first and force a fresh layout read -- otherwise a previously-applied shift would be
    // baked into the rects below, and the delta would compound on every resize instead of being
    // measured against the true unshifted position each time.
    wrap.style.setProperty('--hero-copy-align-shift', '0px');
    const gloveRect = glove.getBoundingClientRect();
    const lineRect = line.getBoundingClientRect();
    if (!gloveRect.height || !lineRect.height) return; // image not laid out/decoded yet
    const targetY = gloveRect.top + gloveRect.height * GLOVE_THUMB_INDEX_GAP_FRACTION;
    const lineCenterY = lineRect.top + lineRect.height / 2;
    wrap.style.setProperty('--hero-copy-align-shift', `${(targetY - lineCenterY).toFixed(1)}px`);
  }

  const requestAlign = () => {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(align);
  };

  align();
  // Glove images load async (eager, but not guaranteed ready before first layout); re-align once
  // they actually have dimensions, and again on anything that can move the text or the image.
  root.querySelectorAll('.hero-product-image').forEach((img) => {
    if (img.complete) return;
    img.addEventListener('load', requestAlign, { once: true });
  });
  document.fonts?.ready?.then(requestAlign);
  window.addEventListener('resize', requestAlign);
  desktopQuery.addEventListener?.('change', requestAlign);
}

export function initHeroEarthRotation({ root = document } = {}) {
  const container = root.querySelector('.hero-earth');
  const path = root.querySelector('.hero-earth__coastline path');
  if (!container || !path) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) return; // leave the server-rendered static frame in place

  const { R, maxDlon, coscMin } = heroEarthRotationParams;
  const D2R = Math.PI / 180;

  // West-to-east planetary rotation reads, for a fixed external viewer, as features drifting
  // left-to-right on screen -- so the sub-viewer longitude drifts west (decreases) over time.
  // Same true-orthographic math as the build script that generated the static frame (sub-viewer
  // on the equator), just re-evaluated every frame instead of baked once.
  const PERIOD_MS = 150000; // one full 360deg turn every 2.5 minutes -- was 2 minutes, slowed down further for a calmer drift
  // Sub-viewer longitude the rotation starts from. 0 (Greenwich) read as starting over Europe;
  // 100 (over Asia) then read as starting too far east. 50 sits between the two (roughly the
  // Urals), then drifts west into Europe ~17s into the loop (matches the static heroEarthPath
  // default below, which is baked at this same longitude).
  const LON_START = 50;
  // 12fps (throttled) was the actual remaining cause of the reported stutter: consistent timing
  // isn't the same as smooth motion, and 12fps reads as discrete steps rather than a continuous
  // turn no matter how evenly spaced. Now that a frame costs ~2ms (post filter-removal), there's
  // no reason to throttle below the display's own refresh rate; this just caps redundant work on
  // very high-refresh-rate displays without any perceptible smoothness cost.
  const UPDATE_INTERVAL_MS = 16;

  function project(lon, lat, lon0) {
    const dlon = ((lon - lon0 + 540) % 360) - 180;
    if (Math.abs(dlon) > maxDlon) return null;
    const latR = lat * D2R, dlonR = dlon * D2R;
    const cosc = Math.cos(latR) * Math.cos(dlonR);
    if (cosc < coscMin) return null;
    const x = R * Math.cos(latR) * Math.sin(dlonR);
    const y = R * Math.sin(latR);
    // Math.round beats toFixed here (called ~7000x/frame) -- sub-pixel precision either way,
    // path data doesn't need a fixed decimal count.
    return `${Math.round(x * 100) / 100},${Math.round(-y * 100) / 100}`;
  }

  function buildPath(lon0) {
    const parts = [];
    for (const run of heroEarthSegments) {
      let segment = [];
      for (const [lon, lat] of run) {
        const p = project(lon, lat, lon0);
        if (p) {
          segment.push(p);
        } else {
          if (segment.length > 1) parts.push(`M ${segment.join(' L ')}`);
          segment = [];
        }
      }
      if (segment.length > 1) parts.push(`M ${segment.join(' L ')}`);
    }
    return parts.join(' ');
  }

  let frame = null;
  let lastUpdate = 0;
  let visible = true;

  function tick(now) {
    frame = window.requestAnimationFrame(tick);
    if (!visible || now - lastUpdate < UPDATE_INTERVAL_MS) return;
    lastUpdate = now;
    const lon0 = LON_START - ((now / PERIOD_MS) % 1) * 360;
    path.setAttribute('d', buildPath(lon0));
  }

  const start = () => {
    if (frame === null) frame = window.requestAnimationFrame(tick);
  };
  const stop = () => {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    path.setAttribute('d', buildPath(LON_START));
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === container) visible = entry.isIntersecting;
      });
    }, { threshold: 0.01 });
    observer.observe(container);
  }

  reduceMotion.addEventListener?.('change', () => {
    if (reduceMotion.matches) stop();
    else start();
  });

  start();
}

export function initPatonSystemDemonstration({ root = document } = {}) {
  const demonstrations = Array.from(root.querySelectorAll('[data-system-demonstration]'));
  if (!demonstrations.length) return;

  demonstrations.forEach((demonstration) => {
    const triggers = Array.from(demonstration.querySelectorAll('[data-system-demo-trigger]'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const awakeningDuration = 2300;
    const followUpDelayMin = 3000;
    const followUpDelayMax = 5000;
    const ambientDelayMin = 9000;
    const ambientDelayMax = 15000;
    const hapticVisualOnset = 35;
    const desktopSignalArrivalRatio = 0.82;
    const mobileSignalArrivalRatio = 0.96;
    const compactPacketCount = 7;
    const compactPacketEdgeInset = 0.025;
    const compactPacketSpawnHold = 110;
    const getCompactShortViewportLift = () => (
      Math.min(18, Math.max(0, (720 - window.innerHeight) * 0.34))
    );
    let emphasisTimer = 0;
    let awakeningTimer = 0;
    let ambientTimer = 0;
    let isVisible = false;
    let isAwakening = false;
    let hasPlayedAmbientFollowUp = false;
    let rapidClickCount = 0;
    let lastSignalClickAt = 0;
    let sparkleUntil = 0;
    let signalCycleGeneration = 0;
    const activeSignalPulses = new Set();
    const activeSignalTimers = new Set();
    const activeSignalFrames = new Set();
    const activeHapticPulses = new Set();
    const activeHapticTimers = new Set();

    demonstration.dataset.awakening = 'pending';

    const clearAmbientAwakening = () => {
      window.clearTimeout(ambientTimer);
      ambientTimer = 0;
    };

    const getAmbientDelay = () => {
      const minimum = hasPlayedAmbientFollowUp ? ambientDelayMin : followUpDelayMin;
      const maximum = hasPlayedAmbientFollowUp ? ambientDelayMax : followUpDelayMax;
      return minimum + Math.random() * (maximum - minimum);
    };

    const scheduleAmbientAwakening = () => {
      clearAmbientAwakening();
      if (
        reduceMotion.matches
        || !isVisible
        || isAwakening
        || document.visibilityState !== 'visible'
      ) return;

      ambientTimer = window.setTimeout(() => {
        hasPlayedAmbientFollowUp = true;
        playAwakening({ restart: true });
      }, getAmbientDelay());
    };

    const finishAwakening = () => {
      window.clearTimeout(awakeningTimer);
      isAwakening = false;
      demonstration.removeAttribute('data-awakening');
      demonstration.removeAttribute('data-signal-origin');
      demonstration.dataset.awakened = 'true';
      demonstration.dataset.phase = 'rest';
      scheduleAmbientAwakening();
    };

    const clearSignalCycle = () => {
      signalCycleGeneration += 1;
      activeSignalTimers.forEach((timer) => window.clearTimeout(timer));
      activeSignalTimers.clear();
      activeSignalFrames.forEach((frame) => window.cancelAnimationFrame(frame));
      activeSignalFrames.clear();
      activeSignalPulses.forEach((pulse) => pulse.remove());
      activeSignalPulses.clear();
      demonstration
        .querySelectorAll('.system-demonstration__signal-path--active')
        .forEach((path) => {
          path.classList.remove('system-demonstration__signal-path--active');
          path.style.removeProperty('--system-active-path-duration');
        });
    };

    const clearHapticFeedback = () => {
      activeHapticTimers.forEach((timer) => window.clearTimeout(timer));
      activeHapticTimers.clear();
      activeHapticPulses.forEach((pulse) => pulse.remove());
      activeHapticPulses.clear();
    };

    const getSignalPacketConfig = () => {
      if (!usesMobileSignalLoop()) return { count: 9, spacing: 0 };

      /*
       * Compact packets are positioned across the arc at launch instead of
       * being emitted one after another at the shared forward/return corner.
       */
      return { count: compactPacketCount, spacing: 0 };
    };

    const activateSignalPath = (direction, delay, duration, cycleGeneration) => {
      const { count, spacing } = getSignalPacketConfig();
      const activeDuration = duration
        + (count - 1) * spacing
        + (usesMobileSignalLoop() ? compactPacketSpawnHold : 0);
      const signalSvg = usesMobileSignalLoop() ? mobileSignalSvg : desktopSignalSvg;
      const pathSelector = usesMobileSignalLoop()
        ? `.system-demonstration__mobile-loop-path--${direction}`
        : `.system-demonstration__path--${direction}`;

      const activate = () => {
        if (cycleGeneration !== signalCycleGeneration) return;
        const path = signalSvg?.querySelector(pathSelector);
        if (!path) return;

        path.classList.remove('system-demonstration__signal-path--active');
        path.style.setProperty('--system-active-path-duration', `${activeDuration}ms`);
        void path.getBoundingClientRect();
        path.classList.add('system-demonstration__signal-path--active');

        const cleanupTimer = window.setTimeout(() => {
          activeSignalTimers.delete(cleanupTimer);
          if (cycleGeneration !== signalCycleGeneration) return;
          path.classList.remove('system-demonstration__signal-path--active');
        }, activeDuration + 80);
        activeSignalTimers.add(cleanupTimer);
      };

      if (delay <= 0) {
        activate();
        return;
      }

      const timer = window.setTimeout(() => {
        activeSignalTimers.delete(timer);
        if (cycleGeneration !== signalCycleGeneration) return;
        activate();
      }, delay);
      activeSignalTimers.add(timer);
    };

    const animateCompactSignalTrain = (direction, duration, cycleGeneration) => {
      if (cycleGeneration !== signalCycleGeneration || !mobileSignalSvg) return;

      const sourcePath = mobileSignalSvg.querySelector(
        `.system-demonstration__beam--${direction}:not(.system-demonstration__beam--pulse) `
        + '.system-demonstration__beam-core',
      );
      const packetLayer = sourcePath?.closest('.system-demonstration__mobile-loop-beam')?.parentNode;
      if (!sourcePath || !packetLayer) return;

      const pathLength = sourcePath.getTotalLength();
      const { startInset, coverage } = getCompactPacketTrainGeometry();
      const travelDistance = 1 - startInset;
      const renderedWidth = mobileSignalSvg.getBoundingClientRect().width || 100;
      const svgUnitsPerPixel = 100 / renderedWidth;
      const svgNamespace = 'http://www.w3.org/2000/svg';
      const packets = [];

      for (let packetIndex = 0; packetIndex < compactPacketCount; packetIndex += 1) {
        const packetProgress = compactPacketCount > 1
          ? packetIndex / (compactPacketCount - 1)
          : 0;
        const packet = document.createElementNS(svgNamespace, 'g');
        packet.classList.add('system-demonstration__compact-packet');
        if (performance.now() < sparkleUntil) {
          packet.classList.add('system-demonstration__compact-packet--sparkle');
        }
        packet.style.setProperty('--system-sparkle-phase', `${-(packetIndex % 4) * 37}ms`);

        const halo = document.createElementNS(svgNamespace, 'circle');
        halo.classList.add('system-demonstration__compact-packet-halo');
        halo.setAttribute('r', String(3.25 * svgUnitsPerPixel));

        const core = document.createElementNS(svgNamespace, 'circle');
        core.classList.add('system-demonstration__compact-packet-core');
        core.setAttribute('r', String(1.35 * svgUnitsPerPixel));

        const glint = document.createElementNS(svgNamespace, 'circle');
        glint.classList.add('system-demonstration__compact-packet-glint');
        glint.setAttribute('r', String(0.58 * svgUnitsPerPixel));

        packet.append(halo, core, glint);
        packetLayer.append(packet);
        activeSignalPulses.add(packet);
        packets.push({
          element: packet,
          startProgress: startInset + packetProgress * coverage,
        });
      }

      const startedAt = performance.now();
      let frameId = 0;
      const removeTrain = () => {
        activeSignalFrames.delete(frameId);
        packets.forEach(({ element }) => {
          element.remove();
          activeSignalPulses.delete(element);
        });
      };
      const renderFrame = (now) => {
        activeSignalFrames.delete(frameId);
        if (cycleGeneration !== signalCycleGeneration) {
          removeTrain();
          return;
        }

        const movementElapsed = Math.max(0, now - startedAt - compactPacketSpawnHold);
        const movementProgress = Math.min(1, movementElapsed / duration);
        packets.forEach(({ element, startProgress }) => {
          const positionProgress = startProgress + movementProgress * travelDistance;
          if (positionProgress > 1) {
            element.style.opacity = '0';
            return;
          }

          const point = sourcePath.getPointAtLength(positionProgress * pathLength);
          element.style.opacity = '1';
          element.setAttribute('transform', `translate(${point.x} ${point.y})`);
        });

        if (movementProgress >= 1) {
          removeTrain();
          return;
        }

        frameId = window.requestAnimationFrame(renderFrame);
        activeSignalFrames.add(frameId);
      };

      frameId = window.requestAnimationFrame(renderFrame);
      activeSignalFrames.add(frameId);
    };

    const animateSignal = (direction, delay, duration, cycleGeneration) => {
      const { count, spacing } = getSignalPacketConfig();
      activateSignalPath(direction, delay, duration, cycleGeneration);
      if (usesMobileSignalLoop()) {
        const launchTrain = () => {
          if (cycleGeneration !== signalCycleGeneration) return;
          animateCompactSignalTrain(direction, duration, cycleGeneration);
        };

        if (delay <= 0) {
          launchTrain();
          return;
        }

        const timer = window.setTimeout(() => {
          activeSignalTimers.delete(timer);
          launchTrain();
        }, delay);
        activeSignalTimers.add(timer);
        return;
      }

      const compactGeometry = usesMobileSignalLoop()
        ? getCompactPacketTrainGeometry()
        : { startInset: 0, coverage: 0 };
      const launchPacket = (packetIndex) => {
        if (cycleGeneration !== signalCycleGeneration) return;
        const beamSelector = `.system-demonstration__beam--${direction}:not(.system-demonstration__beam--pulse)`;
        const signalRoot = usesMobileSignalLoop() ? mobileSignalSvg : desktopSignalSvg;
        const beams = signalRoot?.querySelectorAll(beamSelector) || [];
        const isMobile = usesMobileSignalLoop();
        const progress = count > 1
          ? packetIndex / (isMobile ? count - 1 : count)
          : 0;
        const pathSpread = isMobile
          ? compactGeometry.startInset + progress * compactGeometry.coverage
          : progress * 0.82;
        const startOffset = -pathSpread;
        /*
         * Compact packets form one coherent train. Varying their size and
         * opacity made the tighter spacing read as a single fading blob rather
         * than seven equal data points.
         */
        const strength = isMobile ? 0.9 : 0.3 + progress * 0.7;
        /*
         * Compact packets are one rigid train: every point travels the same
         * normalized distance in the same time. Points that start farther
         * along the arc leave through its endpoint instead of compressing into
         * the points behind them. Desktop keeps its established arrival model.
         */
        const compactTravelDistance = 1 - compactGeometry.startInset;
        const packetDuration = isMobile
          ? duration
          : duration * (1 - pathSpread);
        const endOffset = isMobile
          ? startOffset - compactTravelDistance
          : -1;

        beams.forEach((beam) => {
          const pulse = beam.cloneNode(true);
          pulse.classList.add('system-demonstration__beam--pulse');
          if (performance.now() < sparkleUntil) {
            pulse.classList.add('system-demonstration__beam--sparkle');
          }
          pulse.style.setProperty(
            '--system-signal-delay',
            `${isMobile ? compactPacketSpawnHold : 0}ms`,
          );
          pulse.style.setProperty('--system-signal-duration', `${packetDuration}ms`);
          pulse.style.setProperty(
            '--system-packet-start-offset',
            String(startOffset),
          );
          pulse.style.setProperty(
            '--system-packet-end-offset',
            String(endOffset),
          );
          pulse.style.setProperty(
            '--system-packet-core-start',
            String((isMobile ? 0.66 : 0.32) * strength),
          );
          pulse.style.setProperty('--system-packet-core-peak', String(strength));
          pulse.style.setProperty('--system-packet-core-cruise', String(0.76 * strength));
          pulse.style.setProperty('--system-packet-halo-start', String(0.14 * strength));
          pulse.style.setProperty('--system-packet-halo-peak', String(0.42 * strength));
          pulse.style.setProperty('--system-packet-halo-cruise', String(0.27 * strength));
          pulse.style.setProperty('--system-packet-glint-peak', String(0.82 * strength));
          pulse.style.setProperty('--system-packet-glint-cruise', String(0.42 * strength));
          pulse.style.setProperty('--system-sparkle-phase', `${-(packetIndex % 4) * 37}ms`);

          const core = pulse.querySelector('.system-demonstration__beam-core');
          const halo = pulse.querySelector('.system-demonstration__beam-halo');
          const coreWidth = isMobile ? 2.7 : 1.85 + progress * 0.65;
          const haloWidth = isMobile ? 6.5 : 5.8 + progress * 2.2;
          core?.style.setProperty('stroke-width', String(coreWidth));
          halo?.style.setProperty('stroke-width', String(haloWidth));
          pulse.style.setProperty(
            '--system-packet-glint-width',
            String(isMobile ? 1.15 : Math.max(0.78, coreWidth * 0.42)),
          );

          beam.parentNode?.append(pulse);
          activeSignalPulses.add(pulse);

          window.setTimeout(() => {
            pulse.remove();
            activeSignalPulses.delete(pulse);
          }, packetDuration + (isMobile ? compactPacketSpawnHold : 0) + 100);
        });
      };

      for (let packetIndex = 0; packetIndex < count; packetIndex += 1) {
        const packetDelay = delay + packetIndex * spacing;
        if (packetDelay <= 0) {
          launchPacket(packetIndex);
          continue;
        }

        const timer = window.setTimeout(() => {
          activeSignalTimers.delete(timer);
          if (cycleGeneration !== signalCycleGeneration) return;
          launchPacket(packetIndex);
        }, packetDelay);
        activeSignalTimers.add(timer);
      }
    };

    const playHapticFeedback = (selectors) => {
      if (reduceMotion.matches) return;
      const stack = demonstration.querySelector('.system-demonstration__operator-stack');
      if (!stack) return;

      selectors.forEach((selector) => {
        const source = stack.querySelector(`${selector}:not(.system-demonstration__operator-layer--feedback-pulse)`);
        if (!source) return;

        const pulse = source.cloneNode(true);
        pulse.classList.add('system-demonstration__operator-layer--feedback-pulse');
        stack.append(pulse);
        activeHapticPulses.add(pulse);

        window.setTimeout(() => {
          pulse.remove();
          activeHapticPulses.delete(pulse);
        }, 760);
      });
    };

    const playGloveFeedback = () => playHapticFeedback([
      '.system-demonstration__operator-layer--glove-left',
      '.system-demonstration__operator-layer--glove-right',
    ]);

    const playSuitFeedback = () => playHapticFeedback([
      '.system-demonstration__operator-layer--suit',
    ]);

    const scheduleHapticFeedback = (feedback, delay) => {
      if (delay <= 0) {
        feedback();
        return;
      }

      const timer = window.setTimeout(() => {
        activeHapticTimers.delete(timer);
        feedback();
      }, delay);
      activeHapticTimers.add(timer);
    };

    // Keep the animation source in lockstep with the CSS composition. The
    // horizontal canvas remains active down to tablet landscape sizes. The
    // circular canvas takes over only on genuinely narrow portrait viewports.
    const compactLayoutQuery = window.matchMedia(
      '(max-width: 1024px) and (orientation: portrait)',
    );
    const usesMobileSignalLoop = () => compactLayoutQuery.matches;

    const stage = demonstration.querySelector('.system-demonstration__stage');
    const operatorStack = demonstration.querySelector('.system-demonstration__operator-stack');
    const robotSubject = demonstration.querySelector('.system-demonstration__subject--robot');
    const desktopSignalSvg = demonstration.querySelector('.system-demonstration__signals--desktop');
    const mobileSignalSvg = demonstration.querySelector('.system-demonstration__mobile-loop');
    const mobileCollisionClearance = mobileSignalSvg?.querySelector(
      '.system-demonstration__collision-clearance',
    );
    const patonLabel = demonstration.querySelector('.system-demonstration__paton');
    const forwardLabel = demonstration.querySelector('.system-demonstration__annotation--forward');
    const returnLabel = demonstration.querySelector('.system-demonstration__annotation--return');
    const operatorSourceSize = { width: 1327, height: 1688 };
    const robotSourceSize = { width: 1325, height: 1409 };
    let collisionGeometryFrame = 0;

    const getCompactPacketTrainGeometry = () => {
      /*
       * Compact beams use dedicated paths that contain only their exposed
       * right/left arc. Distribute the train from the first visible endpoint
       * to the last, retaining only enough room for the packet radius.
       */
      const startInset = compactPacketEdgeInset;
      const coverage = 1 - compactPacketEdgeInset * 2;

      return { startInset, coverage };
    };

    const getContainedArtworkRect = (containerRect, sourceSize, alignX, alignY) => {
      const scale = Math.min(
        containerRect.width / sourceSize.width,
        containerRect.height / sourceSize.height,
      );
      const width = sourceSize.width * scale;
      const height = sourceSize.height * scale;

      return {
        left: containerRect.left + (containerRect.width - width) * alignX,
        top: containerRect.top + (containerRect.height - height) * alignY,
        width,
        height,
      };
    };

    const setCollisionImageGeometry = (svg, selector, artworkRect) => {
      if (!svg || !artworkRect) return;
      const svgRect = svg.getBoundingClientRect();
      const viewBox = svg.viewBox?.baseVal;
      const image = svg.querySelector(selector);
      if (!image || !viewBox || svgRect.width <= 0 || svgRect.height <= 0) return;

      const scaleX = viewBox.width / svgRect.width;
      const scaleY = viewBox.height / svgRect.height;
      image.setAttribute('x', String(viewBox.x + (artworkRect.left - svgRect.left) * scaleX));
      image.setAttribute('y', String(viewBox.y + (artworkRect.top - svgRect.top) * scaleY));
      image.setAttribute('width', String(artworkRect.width * scaleX));
      image.setAttribute('height', String(artworkRect.height * scaleY));
    };

    const setCollisionLabelGeometry = (svg, selector, element, padding = 10) => {
      if (!svg || !element) return;
      const svgRect = svg.getBoundingClientRect();
      const viewBox = svg.viewBox?.baseVal;
      const maskRect = svg.querySelector(selector);
      const elementRect = element.getBoundingClientRect();
      if (
        !maskRect
        || !viewBox
        || svgRect.width <= 0
        || svgRect.height <= 0
        || elementRect.width <= 0
        || elementRect.height <= 0
      ) return;

      const scaleX = viewBox.width / svgRect.width;
      const scaleY = viewBox.height / svgRect.height;
      maskRect.setAttribute(
        'x',
        String(viewBox.x + (elementRect.left - svgRect.left - padding) * scaleX),
      );
      maskRect.setAttribute(
        'y',
        String(viewBox.y + (elementRect.top - svgRect.top - padding) * scaleY),
      );
      maskRect.setAttribute('width', String((elementRect.width + padding * 2) * scaleX));
      maskRect.setAttribute('height', String((elementRect.height + padding * 2) * scaleY));
    };

    const positionCompactSignalLoop = () => {
      if (!stage || !mobileSignalSvg || !operatorStack || !robotSubject) return;

      const stageRect = stage.getBoundingClientRect();
      const operatorRect = operatorStack.getBoundingClientRect();
      const robotRect = robotSubject.getBoundingClientRect();
      if (
        stageRect.width <= 0
        || stageRect.height <= 0
        || operatorRect.height <= 0
        || robotRect.height <= 0
      ) return;

      const operatorBottom = operatorRect.bottom - stageRect.top;
      const robotTop = robotRect.top - stageRect.top;
      const artworkGap = Math.max(0, robotTop - operatorBottom);
      const attachmentOverlap = Math.min(16, Math.max(10, stageRect.width * 0.025));

      /*
       * The visible circle has a radius of 40% of its SVG box. Size it so its
       * upper and lower extrema overlap both artwork boundaries slightly; the
       * collision mask then cuts those overlaps back to a constant clearance.
       */
      const idealLoopSize = (artworkGap + attachmentOverlap * 2) / 0.8;
      const loopSize = Math.min(
        stageRect.width * 0.72,
        Math.max(stageRect.width * 0.64, idealLoopSize),
      );
      const loopCenterY = Math.min(
        stageRect.height - loopSize / 2,
        Math.max(
          loopSize / 2,
          (operatorBottom + robotTop) / 2 - getCompactShortViewportLift() / 2,
        ),
      );

      const setStableLength = (property, value) => {
        const nextValue = `${Math.round(value * 100) / 100}px`;
        if (mobileSignalSvg.style.getPropertyValue(property) !== nextValue) {
          mobileSignalSvg.style.setProperty(property, nextValue);
        }
      };
      setStableLength('--system-compact-loop-render-size', loopSize);
      setStableLength('--system-compact-loop-top', loopCenterY);

      if (mobileCollisionClearance) {
        const clearanceCssPixels = Math.min(18, Math.max(12, stageRect.width * 0.036));
        const clearanceInViewBox = clearanceCssPixels * (100 / loopSize);
        mobileCollisionClearance.setAttribute(
          'radius',
          String(Math.round(clearanceInViewBox * 1000) / 1000),
        );
      }
    };

    const positionCompactSignalLabels = () => {
      if (!stage || !mobileSignalSvg || !forwardLabel || !returnLabel) return;

      const stageRect = stage.getBoundingClientRect();
      const loopRect = mobileSignalSvg.getBoundingClientRect();
      if (stageRect.width <= 0 || loopRect.width <= 0) return;

      const centerX = loopRect.left - stageRect.left + loopRect.width / 2;
      const centerY = loopRect.top - stageRect.top + loopRect.height / 2;
      const radius = loopRect.width * 0.4;
      // A real clear-space rule is more robust than viewport-specific nudges:
      // labels sit at least one label line away from the signal stroke.
      const labelGap = Math.max(
        forwardLabel.offsetHeight,
        returnLabel.offsetHeight,
        loopRect.width * 0.035,
      );

      const place = (element, x, y) => {
        element.style.inset = 'auto';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.transform = 'translate(-50%, -50%)';
      };

      const operatorRect = operatorStack?.getBoundingClientRect();
      const robotRect = robotSubject?.getBoundingClientRect();
      const artworkGapCenter = operatorRect && robotRect
        ? ((operatorRect.bottom + robotRect.top) / 2) - stageRect.top
        : centerY;
      const loopLeft = loopRect.left - stageRect.left + loopRect.width * 0.1;
      const loopRight = loopRect.right - stageRect.left - loopRect.width * 0.1;
      const stageGutter = Math.max(8, stageRect.width * 0.018);
      const leftRoom = loopLeft - stageGutter;
      const rightRoom = stageRect.width - stageGutter - loopRight;
      const labelsFitBesideLoop = (
        leftRoom >= returnLabel.offsetWidth + labelGap
        && rightRoom >= forwardLabel.offsetWidth + labelGap
      );

      if (labelsFitBesideLoop) {
        // Wide portrait canvases: both labels share the true visual midpoint
        // between the artworks and sit wholly outside the circle.
        place(
          forwardLabel,
          loopRight + labelGap + forwardLabel.offsetWidth / 2,
          artworkGapCenter,
        );
        place(
          returnLabel,
          loopLeft - labelGap - returnLabel.offsetWidth / 2,
          artworkGapCenter,
        );
        return;
      }

      // Narrow canvases cannot physically fit full labels beside the circle.
      // Use shallower symmetric arc points near the artwork gap instead.
      const labelHorizontalOffset = radius * 0.9;
      const verticalOffset = radius * 0.18;
      place(
        forwardLabel,
        centerX + labelHorizontalOffset,
        Math.min(artworkGapCenter, centerY - verticalOffset)
          - forwardLabel.offsetHeight / 2 - labelGap,
      );
      place(
        returnLabel,
        centerX - labelHorizontalOffset,
        Math.max(artworkGapCenter, centerY + verticalOffset)
          + returnLabel.offsetHeight / 2 + labelGap,
      );
    };

    const resetSignalLabelPositions = () => {
      [forwardLabel, returnLabel].forEach((element) => {
        if (!element) return;
        element.style.removeProperty('inset');
        element.style.removeProperty('left');
        element.style.removeProperty('right');
        element.style.removeProperty('top');
        element.style.removeProperty('bottom');
        element.style.removeProperty('transform');
      });
    };

    const updateCollisionGeometry = () => {
      collisionGeometryFrame = 0;
      if (!stage || !operatorStack || !robotSubject) return;

      const compact = usesMobileSignalLoop();
      demonstration.dataset.layout = compact ? 'compact' : 'landscape';
      const activeSvg = compact ? mobileSignalSvg : desktopSignalSvg;
      if (!activeSvg) return;

      if (compact) {
        // Width is the normal master scale; height is its safety constraint.
        // Both illustrations are reduced together, preserving their 0.865
        // visual ratio, whenever the portrait canvas becomes too crowded.
        // The robot follows the loop's lower quadrant, but its baseline may
        // never leave the stage. This replaces both device-specific `top`
        // nudges and the old viewport-height-dependent `bottom` anchor.
        const stageRect = stage.getBoundingClientRect();
        const operatorSubject = operatorStack.parentElement;
        const nominalOperatorWidth = Math.min(
          stageRect.width * 0.74,
          Math.max(
            stageRect.width * 0.58,
            stageRect.width * 0.97 - window.innerWidth * 0.05,
          ),
        );
        const maxOperatorWidthFromHeight = stageRect.height * 0.44;
        const operatorWidth = Math.min(
          nominalOperatorWidth,
          maxOperatorWidthFromHeight,
        );
        const robotWidth = operatorWidth * 0.865;
        const setStableLength = (element, property, value) => {
          if (!element) return;
          const nextValue = `${Math.round(value * 100) / 100}px`;
          if (element.style.getPropertyValue(property) !== nextValue) {
            element.style.setProperty(property, nextValue);
          }
        };
        setStableLength(
          operatorSubject,
          '--system-compact-operator-render-width',
          operatorWidth,
        );
        setStableLength(
          robotSubject,
          '--system-compact-robot-render-width',
          robotWidth,
        );
        const robotRect = robotSubject.getBoundingClientRect();
        const desiredTop = stageRect.height * 0.58 - getCompactShortViewportLift();
        const baselineTop = stageRect.height * 0.985 - robotRect.height;
        const robotTop = Math.min(desiredTop, baselineTop);
        const currentTop = robotSubject.style.getPropertyValue('--system-compact-robot-top');
        const nextTop = `${Math.round(robotTop * 100) / 100}px`;
        if (currentTop !== nextTop) {
          robotSubject.style.setProperty('--system-compact-robot-top', nextTop);
        }
        positionCompactSignalLoop();
        positionCompactSignalLabels();
      } else {
        robotSubject.style.removeProperty('--system-compact-robot-top');
        operatorStack.parentElement?.style.removeProperty('--system-compact-operator-render-width');
        robotSubject.style.removeProperty('--system-compact-robot-render-width');
        mobileSignalSvg?.style.removeProperty('--system-compact-loop-render-size');
        mobileSignalSvg?.style.removeProperty('--system-compact-loop-top');
        resetSignalLabelPositions();
      }

      const operatorContainerRect = operatorStack.getBoundingClientRect();
      const operatorRect = compact
        ? {
            left: operatorContainerRect.left,
            top: operatorContainerRect.top,
            width: operatorContainerRect.width,
            // Compact artwork is width-fitted and intentionally cropped below
            // the belt. Keep its original coordinate space for exact alignment.
            height: operatorContainerRect.width
              * (operatorSourceSize.height / operatorSourceSize.width),
          }
        : getContainedArtworkRect(operatorContainerRect, operatorSourceSize, 0, 0.5);

      const robotRect = getContainedArtworkRect(
        robotSubject.getBoundingClientRect(),
        robotSourceSize,
        1,
        compact ? 1 : 0.5,
      );

      setCollisionImageGeometry(
        activeSvg,
        '.system-demonstration__collision-image--operator',
        operatorRect,
      );
      setCollisionImageGeometry(
        activeSvg,
        '.system-demonstration__collision-image--robot',
        robotRect,
      );
      setCollisionLabelGeometry(
        activeSvg,
        '.system-demonstration__collision-label--paton',
        patonLabel,
      );
    };

    const requestCollisionGeometryUpdate = () => {
      if (collisionGeometryFrame) return;
      collisionGeometryFrame = window.requestAnimationFrame(updateCollisionGeometry);
    };

    const collisionResizeObserver = 'ResizeObserver' in window
      ? new ResizeObserver(requestCollisionGeometryUpdate)
      : null;
    collisionResizeObserver?.observe(stage);
    collisionResizeObserver?.observe(operatorStack);
    collisionResizeObserver?.observe(robotSubject);
    if (patonLabel) collisionResizeObserver?.observe(patonLabel);
    if (forwardLabel) collisionResizeObserver?.observe(forwardLabel);
    if (returnLabel) collisionResizeObserver?.observe(returnLabel);
    compactLayoutQuery.addEventListener?.('change', requestCollisionGeometryUpdate);
    window.addEventListener('resize', requestCollisionGeometryUpdate, { passive: true });
    window.addEventListener('load', requestCollisionGeometryUpdate, { once: true });
    requestCollisionGeometryUpdate();

    const getSignalArrivalDelay = (signalDelay, signalDuration) => {
      const arrivalRatio = usesMobileSignalLoop()
        ? mobileSignalArrivalRatio
        : desktopSignalArrivalRatio;
      return Math.round(signalDelay + signalDuration * arrivalRatio);
    };

    const getLandscapeLeadingArrivalDelay = (signalDelay, signalDuration) => {
      const { count } = getSignalPacketConfig();
      const leadingPacketSpread = ((count - 1) / count) * 0.82;
      return Math.round(signalDelay + signalDuration * (1 - leadingPacketSpread));
    };

    const getCompactLeadingArrivalDelay = (signalDelay, signalDuration) => {
      const { startInset, coverage } = getCompactPacketTrainGeometry();
      return Math.round(
        signalDelay
        + compactPacketSpawnHold
        + signalDuration * (1 - startInset - coverage) / (1 - startInset),
      );
    };

    const scheduleHapticAtReturnArrival = (returnDelay, returnDuration) => {
      // Begin the transparent pulse just before the visible signal reaches the
      // operator so the first perceptible feedback frame lands with it.
      const arrivalDelay = usesMobileSignalLoop()
        ? getCompactLeadingArrivalDelay(returnDelay, returnDuration)
        : getSignalArrivalDelay(returnDelay, returnDuration);
      scheduleHapticFeedback(
        playSuitFeedback,
        Math.max(0, arrivalDelay - hapticVisualOnset),
      );
    };

    const scheduleGlovesAtForwardStart = (forwardDelay) => {
      scheduleHapticFeedback(playGloveFeedback, forwardDelay);
    };

    const playSignalCycle = (origin = '') => {
      if (reduceMotion.matches) return;

      const cycleGeneration = ++signalCycleGeneration;
      const isMobileSignalLoop = usesMobileSignalLoop();
      const forwardDuration = isMobileSignalLoop ? 680 : 1200;
      const returnDuration = isMobileSignalLoop ? 650 : 1100;

      if (origin === 'return') {
        animateSignal('return', 0, returnDuration, cycleGeneration);
        scheduleHapticAtReturnArrival(0, returnDuration);
        return;
      }

      if (origin === 'forward') {
        animateSignal('forward', 0, forwardDuration, cycleGeneration);
        const returnDelay = isMobileSignalLoop
          ? getCompactLeadingArrivalDelay(0, forwardDuration)
          : getLandscapeLeadingArrivalDelay(0, forwardDuration);
        animateSignal('return', returnDelay, returnDuration, cycleGeneration);
        scheduleGlovesAtForwardStart(0);
        scheduleHapticAtReturnArrival(returnDelay, returnDuration);
        return;
      }

      const forwardDelay = isMobileSignalLoop ? 420 : 880;
      const returnDelay = isMobileSignalLoop
        ? getCompactLeadingArrivalDelay(forwardDelay, forwardDuration)
        : getLandscapeLeadingArrivalDelay(forwardDelay, forwardDuration);
      animateSignal('forward', forwardDelay, forwardDuration, cycleGeneration);
      animateSignal('return', returnDelay, returnDuration, cycleGeneration);
      scheduleGlovesAtForwardStart(forwardDelay);
      scheduleHapticAtReturnArrival(returnDelay, returnDuration);
    };

    const playAwakening = ({ restart = false, origin = '', forceMobileRestart = false } = {}) => {
      if (reduceMotion.matches) {
        finishAwakening();
        return;
      }
      // Pointer, focus and click can fire as one interaction on touch devices.
      // Keep the compact mobile loop single-flight so exactly one signal point
      // completes its outward and return journey before another cycle begins.
      if (usesMobileSignalLoop() && isAwakening && !forceMobileRestart) return;
      if (!isVisible || (isAwakening && !restart)) return;

      window.clearTimeout(awakeningTimer);
      if (usesMobileSignalLoop() && forceMobileRestart) {
        clearSignalCycle();
        clearHapticFeedback();
      }
      clearAmbientAwakening();
      isAwakening = true;
      demonstration.removeAttribute('data-awakening');
      // Force a style flush so the same keyframes can restart on every interaction.
      void demonstration.offsetWidth;
      if (origin === 'forward' || origin === 'return') {
        demonstration.dataset.signalOrigin = origin;
      } else {
        demonstration.removeAttribute('data-signal-origin');
      }
      demonstration.dataset.awakening = 'playing';
      demonstration.dataset.phase = 'awakening';
      playSignalCycle(origin);
      awakeningTimer = window.setTimeout(finishAwakening, awakeningDuration);
    };

    const setEmphasis = (direction = '') => {
      window.clearTimeout(emphasisTimer);
      if (direction) demonstration.dataset.emphasis = direction;
      else demonstration.removeAttribute('data-emphasis');
      if (!direction && !isAwakening) scheduleAmbientAwakening();
    };

    const holdEmphasis = (direction) => {
      setEmphasis(direction);
      emphasisTimer = window.setTimeout(() => setEmphasis(), 1800);
    };

    triggers.forEach((trigger) => {
      const action = trigger.dataset.systemDemoTrigger;
      trigger.addEventListener('pointerdown', (event) => {
        if (!usesMobileSignalLoop() || event.button !== 0) return;
        /*
         * A click is dispatched after pointer-down/up. Clear the preceding
         * compact cycle at the first physical interaction frame so its final
         * return packet cannot be perceived as part of the new forward train.
         */
        clearSignalCycle();
        clearHapticFeedback();
      });
      trigger.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'touch') return;
        setEmphasis(action);
        playAwakening({ restart: true, origin: action });
      });
      trigger.addEventListener('pointerleave', () => setEmphasis());
      trigger.addEventListener('focus', () => {
        if (window.matchMedia('(hover: none)').matches) return;
        setEmphasis(action);
        playAwakening({ restart: true, origin: action });
      });
      trigger.addEventListener('blur', () => setEmphasis());
      trigger.addEventListener('click', () => {
        const clickTime = performance.now();
        rapidClickCount = clickTime - lastSignalClickAt <= 650
          ? rapidClickCount + 1
          : 1;
        lastSignalClickAt = clickTime;
        if (rapidClickCount >= 3) sparkleUntil = clickTime + 2200;

        holdEmphasis(action);
        playAwakening({
          restart: true,
          origin: action,
          forceMobileRestart: usesMobileSignalLoop(),
        });
      });
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target !== demonstration) return;
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible) playAwakening({ restart: true });
        else if (!isVisible) clearAmbientAwakening();
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.32 });

    observer.observe(demonstration);

    const handlePreferenceChange = () => {
      const bounds = demonstration.getBoundingClientRect();
      isVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;
      if (reduceMotion.matches) {
        clearAmbientAwakening();
        window.clearTimeout(awakeningTimer);
        clearSignalCycle();
        clearHapticFeedback();
        isAwakening = false;
        demonstration.removeAttribute('data-awakening');
        demonstration.dataset.awakened = 'true';
        demonstration.dataset.phase = 'rest';
      } else if (isVisible) {
        playAwakening({ restart: true });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        clearAmbientAwakening();
      } else if (isVisible && !isAwakening) {
        scheduleAmbientAwakening();
      }
    };

    reduceMotion.addEventListener?.('change', handlePreferenceChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });
}

export function initSectionReveals({ root = document } = {}) {
  const elements = Array.from(root.querySelectorAll('.reveal-block'));
  if (!elements.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.dataset.revealed = 'true');
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.dataset.revealed = 'true';
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

  elements.forEach((element) => observer.observe(element));
}

export function initSectionNavigation({ root = document } = {}) {
  const links = Array.from(root.querySelectorAll('[data-nav-link][href^="#"]'));
  if (!links.length) return;

  const sections = links
    .map((link) => root.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if (!sections.length) return;

  const initialHash = window.location.hash;
  const hasInitialSectionHash = sections.some((section) => initialHash === `#${section.id}`);

  if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';

  if (hasInitialSectionHash) {
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
  }

  window.scrollTo(0, 0);

  const finishInitialNavigation = () => {
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
  };

  window.addEventListener('pageshow', finishInitialNavigation, { once: true });
  if (document.readyState === 'complete') finishInitialNavigation();
  else window.addEventListener('load', finishInitialNavigation, { once: true });
}

export function initSite(root = document) {
  initColorTheme({ root });
  initThemeImages({ root });
  initHeroProductThemeTransition({ root });
  initLanguageSelector({ root });
  initTwoLineHeadings({ root });
  initMobileNavigation({ root });
  initHeroHeadlineLanguages({ root });
  initDevelopmentUpdatesForm({ root });
  initPrototypeVideoCover({ root });
  initPrototypeFilmViewport({ root });
  initHeroMobileGloveScroll({ root });
  initHeroCopyAlignment({ root });
  initHeroEarthRotation({ root });
  initPatonSystemDemonstration({ root });
  initSectionReveals({ root });
  initSectionNavigation({ root });
}

if (typeof document !== 'undefined') {
  onDocumentReady(() => initSite());
}
