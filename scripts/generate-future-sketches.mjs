import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

// Derive from the exact deployed artwork, not an older archived sketch.
// Lossless WebP preserves the resized RGB and alpha without another lossy encode.
const root = new URL('../public/assets/images/possible-futures/sketches/', import.meta.url);
const motifs = ['vr-hydrogen-engine-touch', 'static-haptic', 'humanoid-arms-knipex-pliers', 'operator-vr-paton-glove', 'humanoid-with-rose'];
const names = motifs.flatMap((name) => [`${name}-black`, `${name}-white`]);
const widths = [320, 480, 640, 768, 960, 1120, 1440, 1680];
await mkdir(new URL('responsive/', root), { recursive: true });
const manifest = {};
for (const name of names) {
  const source = new URL(`webp/${name}.webp`, root);
  const original = await readFile(source);
  const metadata = await sharp(original).metadata();
  const variants = [];
  for (const width of widths.filter((width) => width < metadata.width)) {
    const image = await sharp(original).resize({ width, withoutEnlargement: true }).webp({ lossless: true, effort: 6 }).toBuffer();
    // An original can be both sharper and smaller than a near-original derivative.
    if (image.length >= original.length) continue;
    const file = `${name}-${width}.webp`;
    await writeFile(new URL(`responsive/${file}`, root), image);
    variants.push([`/assets/images/possible-futures/sketches/responsive/${file}`, width]);
  }
  variants.push([`/assets/images/possible-futures/sketches/webp/${name}.webp`, metadata.width]);
  manifest[name] = { width: metadata.width, height: metadata.height, variants };
}
await writeFile(new URL('../src/data/future-sketches.json', import.meta.url), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated lossless responsive variants for ${names.length} theme/sketch sources.`);
