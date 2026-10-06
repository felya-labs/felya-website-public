// Real projection math with a deterministic browser clock and lifecycle events.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { heroEarthSegments, heroEarthRotationParams } from "../src/data/hero-earth-coastline.js";
const source = fs.readFileSync(new URL("../src/scripts/site.js", import.meta.url), "utf8");
const globe = source.slice(source.indexOf("export function initHeroEarthRotation"), source.indexOf("export function initHeroBeyondEarthStarfield")).replace("export function", "function");
function hub(extra = {}) {
  const listeners = new Map();
  return Object.assign({ addEventListener(n, cb) {
    if (!listeners.has(n)) listeners.set(n, new Set());
    listeners.get(n).add(cb);
  }, removeEventListener(n, cb) {
    listeners.get(n)?.delete(cb);
  }, emit(n, e = {}) {
    for (const cb of [...listeners.get(n) || []]) cb(e);
  }, count() {
    return [...listeners.values()].reduce((a, s) => a + s.size, 0);
  } }, extra);
}
for (const initiallyReduced of [false, true]) {
  const pending = new Map(), observers = new Set();
  let id = 0, updates = 0, pathValue = "SSR", time = 0;
  const container = {}, path = { setAttribute(n, v) {
    if (n === "d") {
      updates++;
      pathValue = v;
    }
  } };
  const reduce = hub({ matches: initiallyReduced });
  const mobile = hub({ matches: true });
  const coarse = hub({ matches: false });
  const root = { querySelector(s) {
    return s === "[data-hero-earth-drag]" || s === ".hero-earth" ? container : path;
  } };
  const doc = hub({ visibilityState: "visible" });
  class IO {
    constructor(cb) {
      this.cb = cb;
      observers.add(this);
    }
    observe() {
    }
    disconnect() {
      observers.delete(this);
    }
  }
  const win = hub({ IntersectionObserver: IO, innerWidth: 393, matchMedia: (q) => {
    if (q.includes("reduced")) return reduce;
    if (q.includes("hover") || q.includes("pointer")) return coarse;
    return mobile;
  }, requestAnimationFrame(cb) {
    pending.set(++id, cb);
    return id;
  }, cancelAnimationFrame(i) {
    pending.delete(i);
  } });
  const init = vm.runInNewContext("(" + globe + ")", { window: win, document: doc, IntersectionObserver: IO, heroEarthSegments, heroEarthRotationParams, performance: { now: () => time } });
  const visible = (v) => {
    for (const o of observers) o.cb([{ target: container, isIntersecting: v }]);
  };
  const step = (delta) => {
    time += delta;
    const callbacks = [...pending.values()];
    pending.clear();
    callbacks.forEach((cb) => cb(time));
    assert.ok(pending.size <= 1, "duplicate globe RAF");
  };
  const resumeCheck = () => {
    const before = pathValue;
    step(5e3);
    assert.equal(pathValue, before, "resume angle jumped");
    step(40);
    assert.notEqual(pathValue, before, "resume did not rotate");
  };
  init({ root });
  visible(true);
  if (initiallyReduced) {
    assert.equal(pending.size, 0);
    reduce.matches = false;
    reduce.emit("change");
  }
  step(16.7);
  step(40);
  const initialUpdates = updates;
  visible(false);
  assert.equal(pending.size, 0);
  step(5e3);
  assert.equal(updates, initialUpdates);
  visible(true);
  resumeCheck();
  doc.visibilityState = "hidden";
  doc.emit("visibilitychange");
  assert.equal(pending.size, 0);
  doc.visibilityState = "visible";
  doc.emit("visibilitychange");
  resumeCheck();
  reduce.matches = true;
  step(5000); // A media query can change before its change event is delivered.
  reduce.emit("change");
  assert.equal(pending.size, 0);
  reduce.matches = false;
  reduce.emit("change");
  resumeCheck();
  // heroStatic reuses the existing mobilePerf scroll signal. Pausing clears the
  // integration clock, so a long scroll never causes a catch-up rotation.
  doc.emit('felya:mobileperfscroll', { detail: { variant: 'heroStatic', active: true } });
  assert.equal(pending.size, 0);
  const pausedPath = pathValue;
  step(5e3);
  assert.equal(pathValue, pausedPath, 'heroStatic scroll advanced earth');
  doc.emit('felya:mobileperfscroll', { detail: { variant: 'heroStatic', active: false } });
  resumeCheck();
  win.emit("pagehide", { persisted: true });
  assert.equal(pending.size, 0);
  win.emit("pageshow", { persisted: true });
  resumeCheck();
  doc.emit("freeze");
  assert.equal(pending.size, 0);
  doc.emit("resume");
  resumeCheck();
  let initialCount = updates;
  for (let i = 0; i < 300; i += 1) step(1000 / 60);
  assert.ok(Math.abs(updates - initialCount - 150) <= 1, "mobile update rate");
  mobile.matches = false;
  mobile.emit("change");
  initialCount = updates;
  for (let i = 0; i < 300; i += 1) step(1000 / 60);
  assert.ok(Math.abs(updates - initialCount - 300) <= 1, "desktop update rate");
  const angle = pathValue;
  init({ root });
  assert.equal(observers.size, 1);
  visible(true);
  step(5e3);
  assert.equal(pathValue, angle, "reinitialization reset angle");
  assert.equal(win.count(), 2);
  // Beyond Earth and the mobile diagnostic scroll gate each own one persistent
  // document listener per initialization; lifecycle cleanup leaves only those
  // application listeners.
  assert.equal(doc.count(), 6);
  container.__felyaEarthCleanup();
  assert.equal(pending.size, 0);
  assert.equal(observers.size, 0);
  assert.equal(win.count(), 0);
  assert.equal(doc.count(), 2);
  assert.equal(reduce.count(), 0);
  assert.equal(mobile.count(), 0);
  console.log("Lifecycle passed; initially reduced:", initiallyReduced);
}

// A compact coarse-pointer Hero rotates at a light 20 Hz when idle. It uses
// the existing scroll signal to pause all projections during active scroll,
// then resumes without a duplicate RAF; Beyond Earth remains one lifecycle.
{
  const pending = new Map(), observers = new Set();
  let id = 0, updates = 0, time = 0;
  const container = {}, path = { setAttribute(name) { if (name === 'd') updates += 1; } };
  const reduce = hub({ matches: false });
  const compact = hub({ matches: true });
  const coarse = hub({ matches: true });
  const doc = hub({ visibilityState: 'visible' });
  class IO { constructor(callback) { this.callback = callback; observers.add(this); } observe() {} disconnect() { observers.delete(this); } }
  const win = hub({ IntersectionObserver: IO, matchMedia(query) {
    if (query.includes('reduced')) return reduce;
    if (query.includes('hover') || query.includes('pointer')) return coarse;
    return compact;
  }, requestAnimationFrame(callback) { pending.set(++id, callback); return id; }, cancelAnimationFrame(frame) { pending.delete(frame); } });
  const init = vm.runInNewContext('(' + globe + ')', { window: win, document: doc, IntersectionObserver: IO, heroEarthSegments, heroEarthRotationParams, performance: { now: () => time } });
  const step = (delta) => {
    time += delta;
    const callbacks = [...pending.values()];
    pending.clear();
    callbacks.forEach((callback) => callback(time));
    assert.ok(pending.size <= 1, 'mobile lite duplicate Earth RAF');
  };
  const visible = (state) => observers.forEach((observer) => observer.callback([{ target: container, isIntersecting: state }]));
  init({ root: { querySelector(selector) { return selector === '[data-hero-earth-drag]' || selector === '.hero-earth' ? container : path; } } });
  visible(true);
  assert.equal(pending.size, 1, 'mobile idle did not schedule Earth RAF');
  for (let index = 0; index < 300; index += 1) step(1000 / 60);
  assert.ok(Math.abs(updates - 100) <= 1, 'mobile idle Earth update rate');
  doc.emit('felya:mobileperfscroll', { detail: { variant: 'normal', active: true } });
  assert.equal(pending.size, 0, 'mobile scroll left Earth RAF running');
  const pausedUpdates = updates;
  for (let index = 0; index < 120; index += 1) step(1000 / 60);
  assert.equal(updates, pausedUpdates, 'mobile scroll projected Earth');
  doc.emit('felya:mobileperfscroll', { detail: { variant: 'normal', active: false } });
  assert.equal(pending.size, 1, 'mobile idle did not resume Earth RAF');
  step(50);
  assert.ok(updates > pausedUpdates, 'mobile idle after scroll did not project Earth');
  visible(false);
  assert.equal(pending.size, 0, 'offscreen mobile Earth RAF');
  visible(true);
  assert.equal(pending.size, 1, 'visible mobile Earth did not resume');
  doc.visibilityState = 'hidden';
  doc.emit('visibilitychange');
  assert.equal(pending.size, 0, 'hidden mobile Earth RAF');
  doc.visibilityState = 'visible';
  doc.emit('visibilitychange');
  assert.equal(pending.size, 1, 'visible mobile Earth did not resume after hidden');
  reduce.matches = true;
  reduce.emit('change');
  assert.equal(pending.size, 0, 'reduced-motion mobile Earth RAF');
  reduce.matches = false;
  reduce.emit('change');
  assert.equal(pending.size, 1, 'mobile Earth did not resume after reduced motion');
  doc.emit('felya:beyondearth', { detail: { active: true } });
  assert.equal(pending.size, 1, 'Beyond Earth created a duplicate RAF');
  step(50);
  doc.emit('felya:beyondearth', { detail: { active: false } });
  assert.equal(pending.size, 1, 'Beyond Earth reset did not return to mobile idle lifecycle');
  doc.emit('felya:mobileperfscroll', { detail: { variant: 'normal', active: true } });
  assert.equal(pending.size, 0, 'mobile scroll did not pause Earth after Beyond Earth reset');
  doc.emit('felya:mobileperfscroll', { detail: { variant: 'normal', active: false } });
  assert.equal(pending.size, 1, 'mobile idle did not resume after Beyond Earth reset');
  container.__felyaEarthCleanup();
  console.log('Mobile idle Earth lifecycle passed');
}

const headlineSource = source.slice(source.indexOf('export function initHeroHeadlineLanguages'), source.indexOf('export function setDevelopmentUpdatesStatus'));
assert.match(headlineSource, /mobileHeroLite/);
assert.match(headlineSource, /if \(mobileHeroLite\) \{\s*hitbox\.removeAttribute\('data-hero-intro-pending'\)/);
assert.match(headlineSource, /!isEasterEggActive && !mobileHeroLite/);
console.log('Mobile Hero Lite headline guards present');


// Preserve the original 4px scroll curve, while proving that saturated scrolling
// does not schedule more frames, read viewport dimensions or repeat CSS writes.
const hero = source.slice(source.indexOf('export function initHeroMobileGloveScroll'),
  source.indexOf('export function initHeroCopyAlignment')).replace('export function', 'function');
{
  const pending = new Map();
  const properties = new Map();
  let id = 0;
  let writes = 0;
  let viewportReads = 0;
  let width = 393;
  let height = 851;
  const reduce = hub({ matches: false });
  const stage = { closest() { return stage; }, style: {
    setProperty(name, value) { writes += 1; properties.set(name, value); },
    removeProperty(name) { properties.delete(name); }
  } };
  const win = hub({ scrollY: 0, matchMedia: () => reduce,
    requestAnimationFrame(callback) { pending.set(++id, callback); return id; },
    cancelAnimationFrame(frame) { pending.delete(frame); }
  });
  Object.defineProperties(win, {
    innerWidth: { get() { viewportReads += 1; return width; } },
    innerHeight: { get() { viewportReads += 1; return height; } }
  });
  let observer;
  class IO { constructor(callback) { observer = callback; } observe() {} }
  win.IntersectionObserver = IO;
  const doc = { documentElement: { dataset: {} } };
  const init = vm.runInNewContext('(' + hero + ')', { window: win, document: doc, IntersectionObserver: IO });
  init({ root: { querySelectorAll: () => [stage] } });
  const flush = () => { const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach((callback) => callback()); };
  const scroll = (y) => {
    win.scrollY = y;
    win.emit('scroll');
    const callbacks = [...pending.values()];
    pending.clear();
    callbacks.forEach((callback) => callback());
  };
  for (const [y, value] of [[0, '0.00px'], [90, '-1.00px'], [180, '-2.00px'],
    [270, '-3.00px'], [360, '-4.00px']]) {
    scroll(y);
    assert.equal(properties.get('--hero-glove-y'), value);
  }
  observer([{ isIntersecting: false, boundingClientRect: { bottom: -1 } }]);
  flush();
  const readsBefore = viewportReads;
  const writesBefore = writes;
  for (let y = 400; y <= 5000; y += 10) {
    win.scrollY = y;
    win.emit('scroll');
    assert.equal(pending.size, 0, 'saturated hero scheduled RAF');
  }
  assert.equal(writes, writesBefore);
  assert.equal(viewportReads, readsBefore);
  observer([{ isIntersecting: true, boundingClientRect: { bottom: 800 } }]);
  scroll(180);
  assert.equal(properties.get('--hero-glove-y'), '-2.00px');
  const stableWrites = writes;
  scroll(180);
  assert.equal(writes, stableWrites, 'identical CSS value rewritten');
  height = 600;
  win.emit('resize');
  flush();
  scroll(144);
  assert.equal(properties.get('--hero-glove-y'), '-2.00px');
  width = 851;
  win.emit('resize');
  flush();
  assert.equal(properties.has('--hero-glove-y'), false);
  width = 393;
  win.emit('resize');
  flush();
  reduce.matches = true;
  reduce.emit('change');
  flush();
  assert.equal(properties.has('--hero-glove-y'), false);
  reduce.matches = false;
  reduce.emit('change');
  flush();
  assert.equal(properties.get('--hero-glove-y'), '-2.00px');

  // Both glove-only and full-hero diagnostics leave the normal CSS position
  // untouched and add no scroll work to the existing glove controller.
  for (const variant of ['gloveStatic', 'heroStatic']) {
    properties.clear();
    doc.documentElement.dataset.mobilePerf = variant;
    const staticStage = { closest() { return staticStage; }, style: {
      setProperty(name, value) { properties.set(name, value); },
      removeProperty(name) { properties.delete(name); }
    } };
    init({ root: { querySelectorAll: () => [staticStage] } });
    assert.equal(properties.has('--hero-glove-y'), false, `${variant} sets glove translation`);
    assert.equal(pending.size, 0, `${variant} schedules glove RAF`);
  }
  console.log('Hero curve, saturation, resize/orientation and reduced motion passed');
}
