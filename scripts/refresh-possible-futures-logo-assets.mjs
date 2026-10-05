/**
 * Archives the pre-logo Possible Futures artwork and publishes the supplied
 * white PNG masters together with dark-on-light counterparts.
 *
 * Usage:
 *   node scripts/refresh-possible-futures-logo-assets.mjs
 */

import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(root, 'assets-source/possible-futures/source-sketches/png');
const runtimeDirectory = path.join(root, 'public/assets/images/possible-futures/sketches/webp');
const archiveDirectory = path.join(root, 'assets-source/possible-futures/archive/2026-09-27-logo-refresh');
const suppliedDirectory = '/Users/mario/Downloads';

const motifs = [
  { name: 'static-haptic', supplied: 'static-haptic-white_pyra.png' },
  { name: 'vr-hydrogen-engine-touch', supplied: 'vr-hydrogen-engine-touch-white_pyra.png' },
  { name: 'operator-vr-paton-glove', supplied: 'operator-vr-paton-glove-white_pyra.png' },
];

const existingDerivatives = [
  'assets-source/possible-futures/system-style-masks/png/{name}-mask.png',
  'assets-source/possible-futures/system-style-masks/webp/{name}-mask.webp',
  'assets-source/possible-futures/system-style-masks-refined/png/{name}-mask.png',
  'assets-source/possible-futures/system-style-masks-refined/webp/{name}-mask.webp',
];

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function archive(file) {
  if (!await exists(file)) return;
  const relative = path.relative(root, file);
  const target = path.join(archiveDirectory, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(file, target, { force: false, errorOnExist: true });
}

async function createBlackMaster(whiteMaster, blackMaster) {
  const { data, info } = await sharp(whiteMaster).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += info.channels) {
    const [red, green, blue, alpha] = data.subarray(offset, offset + 4);
    if (alpha === 0) continue;

    // The drawings are neutral white/grey. The turquoise FELYA mark is retained
    // in both themes instead of being converted to black.
    if (Math.max(red, green, blue) - Math.min(red, green, blue) <= 12) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
    }
  }

  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(blackMaster);
}

async function createRuntime(source, target) {
  await sharp(source).webp({ lossless: true, effort: 6 }).toFile(target);
}

for (const motif of motifs) {
  const whiteSource = path.join(sourceDirectory, `${motif.name}-white.png`);
  const blackSource = path.join(sourceDirectory, `${motif.name}-black.png`);
  const whiteRuntime = path.join(runtimeDirectory, `${motif.name}-white.webp`);
  const blackRuntime = path.join(runtimeDirectory, `${motif.name}-black.webp`);
  const legacyRuntime = motif.name === 'static-haptic'
    ? path.join(runtimeDirectory, 'static-haptic-refined-mask.webp')
    : null;

  await Promise.all([whiteSource, blackSource, whiteRuntime, blackRuntime].map(archive));
  if (legacyRuntime) {
    await archive(legacyRuntime);
    await rm(legacyRuntime, { force: true });
  }
  await Promise.all(existingDerivatives.map((template) => archive(path.join(root, template.replace('{name}', motif.name)))));

  const supplied = path.join(suppliedDirectory, motif.supplied);
  if (!await exists(supplied)) throw new Error(`Missing supplied master: ${supplied}`);

  await cp(supplied, whiteSource);
  await createBlackMaster(whiteSource, blackSource);
  await Promise.all([
    createRuntime(whiteSource, whiteRuntime),
    createRuntime(blackSource, blackRuntime),
  ]);
}

console.log(`Archived previous artwork in ${path.relative(root, archiveDirectory)}`);
console.log('Published refreshed Possible Futures PNG masters and lossless WebP theme variants.');
