// Keep the current visual in place until an on-demand replacement is decoded.
const pendingImages = new WeakMap();

export function loadImage(image, { eager = false } = {}) {
  if (eager) image.loading = 'eager';
  if (image.dataset.srcset && image.getAttribute('srcset') !== image.dataset.srcset) {
    image.srcset = image.dataset.srcset;
  }
  if (image.dataset.src && image.getAttribute('src') !== image.dataset.src) {
    image.src = image.dataset.src;
  }
  if (!eager) return Promise.resolve();
  const key = `${image.getAttribute('src')}|${image.getAttribute('srcset')}`;
  if (pendingImages.get(image)?.key !== key) {
    const ready = image.decode().finally(() => {
      if (pendingImages.get(image)?.key === key) pendingImages.delete(image);
    });
    pendingImages.set(image, { key, ready });
  }
  return pendingImages.get(image).ready;
}

export function isNearViewport(element, margin = 600) {
  const bounds = element.getBoundingClientRect();
  return bounds.bottom >= -margin && bounds.top <= window.innerHeight + margin;
}

export function initPartnerImages({ root = document } = {}) {
  const frames = [...root.querySelectorAll('[data-partner-images]')];
  const hover = window.matchMedia('(hover: hover)');
  const defaultSources = new Map();
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      defaultSources.get(entry.target)().forEach((image) => {
        loadImage(image, { eager: true }).catch(() => {});
      });
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '1600px 0px', threshold: 0 }) : null;
  const theme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

  frames.forEach((frame) => {
    const image = (color, state) => frame.querySelector(`[data-partner-variant="${color}-${state}"]`);
    // These three logos already have a visible dark underlay in the light theme.
    // Preserve that compositing exactly; do not silently change their brightness.
    const defaults = (color) => [image(color, 'default'),
      ...(color === 'light' && frame.hasAttribute('data-partner-light-overlay')
        ? [image('dark', 'default')] : [])];
    defaultSources.set(frame, () => defaults(theme()));
    observer?.observe(frame);
    let pointerInside = false;
    let focused = false;
    let generation = 0;
    const wantsHover = () => focused || (hover.matches && pointerInside);
    const refresh = async () => {
      const request = ++generation;
      const color = theme();
      if (!wantsHover()) {
        frame.classList.remove('partner-logo-frame--active');
        return;
      }
      try {
        await loadImage(image(color, 'hover'), { eager: true });
        if (request === generation && color === theme() && wantsHover()) {
          frame.classList.add('partner-logo-frame--active');
        }
      } catch { /* Keep the default logo if the optional hover image fails. */ }
    };
    defaults(theme()).forEach((logo) => loadImage(logo));
    frame.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      pointerInside = true;
      refresh();
    });
    frame.addEventListener('pointerleave', () => { pointerInside = false; refresh(); });
    frame.addEventListener('focusin', () => { focused = frame.matches(':focus-visible'); refresh(); });
    frame.addEventListener('focusout', () => { focused = false; refresh(); });
    hover.addEventListener?.('change', refresh);

    document.addEventListener('felya:beforethemechange', (event) => {
      if (!isNearViewport(frame)) return;
      const color = event.detail.theme;
      defaults(color).forEach((logo) => event.detail.waitUntil(loadImage(logo, { eager: true })));
      if (wantsHover()) event.detail.waitUntil(loadImage(image(color, 'hover'), { eager: true }));
    });
    document.addEventListener('felya:themechange', () => {
      ++generation;
      frame.classList.remove('partner-logo-frame--active');
      defaults(theme()).forEach((logo) => loadImage(logo));
      refresh();
    });
  });
}

const futureSource = (image, theme) => ({
  src: theme === 'dark' ? image.dataset.darkSrc : image.dataset.lightSrc,
  srcset: theme === 'dark' ? image.dataset.darkSrcset : image.dataset.lightSrcset
});

function setFutureSource(image, theme) {
  const source = futureSource(image, theme);
  image.dataset.src = source.src;
  image.dataset.srcset = source.srcset;
}

function prepareFutureTheme(image, theme) {
  const source = futureSource(image, theme);
  if (image.getAttribute('src') === source.src && image.getAttribute('srcset') === source.srcset) {
    return loadImage(image, { eager: true });
  }
  const replacement = new Image();
  replacement.sizes = image.sizes;
  replacement.srcset = source.srcset;
  replacement.src = source.src;
  return replacement.decode();
}

export function initFutureImages({ root = document } = {}) {
  const cards = [...root.querySelectorAll('.future-scenario')];
  if (!cards.length) return;
  const theme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  const images = (card) => [...card.querySelectorAll('[data-future-image]')];
  const states = new Map(cards.map((card) => [card, { near: false, theme: null, loading: false }]));
  const queue = [];
  let active = false;

  // The HTML sources are a no-JavaScript fallback. Once enhanced, this observer owns
  // the loading distance instead of the browser's connection-dependent lazy threshold.
  cards.forEach((card) => images(card).forEach((image) => {
    image.removeAttribute('srcset');
    image.removeAttribute('src');
  }));

  const enqueue = (card) => {
    const state = states.get(card);
    if (state.theme !== theme() && !state.loading && !queue.includes(card)) queue.push(card);
  };
  const pump = async () => {
    if (active) return;
    let card;
    while (queue.length) {
      const candidate = queue.shift();
      const state = states.get(candidate);
      if (state.near && state.theme !== theme()) { card = candidate; break; }
    }
    if (!card) return;
    const state = states.get(card);
    const color = theme();
    active = true;
    state.loading = true;
    card.dataset.imagesReady = 'false';
    let succeeded = false;
    try {
      // One card at a time: at most two sketch requests concurrently. Queued cards
      // which leave the 1600px window are skipped; initial hero traffic is untouched.
      const outcomes = await Promise.allSettled(images(card).map((image) => {
        setFutureSource(image, color);
        return loadImage(image, { eager: true });
      }));
      if (outcomes.some((result) => result.status === 'rejected')) throw new Error('Sketch unavailable');
      state.theme = color;
      card.dataset.imagesReady = String(color === theme());
      succeeded = true;
    } catch { /* Keep text visible; a later viewport entry can retry a failed image. */ }
    finally {
      state.loading = false;
      active = false;
      if (succeeded && state.near && state.theme !== theme()) enqueue(card);
      pump();
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        states.get(entry.target).near = entry.isIntersecting;
        if (entry.isIntersecting) enqueue(entry.target);
      });
      pump();
    }, { rootMargin: '1600px 0px', threshold: 0 });
    cards.forEach((card) => observer.observe(card));
  } else {
    cards.forEach((card) => { states.get(card).near = true; enqueue(card); });
    pump();
  }

  document.addEventListener('felya:beforethemechange', (event) => {
    cards.filter((card) => isNearViewport(card)).forEach((card) => {
      images(card).forEach((image) => event.detail.waitUntil(prepareFutureTheme(image, event.detail.theme)));
    });
  });
  document.addEventListener('felya:themechange', () => {
    cards.forEach((card) => {
      const state = states.get(card);
      if (isNearViewport(card)) {
        // The before-theme hook decoded these sources; swap in the same task as the theme.
        images(card).forEach((image) => {
          setFutureSource(image, theme());
          loadImage(image);
        });
        state.theme = theme();
        card.dataset.imagesReady = 'true';
      } else if (state.near) enqueue(card);
    });
    pump();
  });
}
