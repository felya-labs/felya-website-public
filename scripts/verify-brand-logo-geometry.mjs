import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.join(root, 'assets-source/brand/source/logo-v5');
const logoRoot = path.join(root, 'public/assets/images/brand/felya-logo');
const sha256 = (contents) => crypto.createHash('sha256').update(contents).digest('hex');
const masters = [
  { source: 'pyra.svg', stem: 'felya-mark', pngWidth: 1200, sha256: 'db062249ca74e99c510de058e2d2e7d38711943176a7aa096f8394f46bee446c' },
  { source: 'felya-horizontal.svg', stem: 'felya-logo-horizontal', pngWidth: 1800, sha256: '6b79774f998f2c8c5d01eb2dc499a00232d27a655ae44898f910c7a1bb195cdf' },
  { source: 'felya-vertical.svg', stem: 'felya-logo-vertical', pngWidth: 1200, sha256: 'dbb28ed0c403cee703aafaa560dd7bb8716021652a13f35a0efdca947b3caf87' }
];
const explicitColor = (source, color) => source.replace('fill="currentColor"', `fill="${color}"`);

for (const master of masters) {
  const source = await fs.readFile(path.join(sourceRoot, master.source));
  if (sha256(source) !== master.sha256) throw new Error(`V5 SOURCE HASH: FAIL (${master.source})`);
  for (const [variant, color] of [['black', '#000000'], ['white', '#FFFFFF']]) {
    const svg = await fs.readFile(path.join(logoRoot, `${master.stem}-${variant}.svg`), 'utf8');
    if (svg !== explicitColor(source.toString('utf8'), color)) throw new Error(`V5 SVG PROVENANCE: FAIL (${master.stem}-${variant})`);
    const metadata = await sharp(path.join(logoRoot, `${master.stem}-${variant}.png`)).metadata();
    if (metadata.width !== master.pngWidth || !metadata.hasAlpha) throw new Error(`V5 PNG EXPORT: FAIL (${master.stem}-${variant})`);
  }
}

const faviconRoot = path.join(root, 'public/assets/favicon');
const frozenFaviconFiles = new Map([
  ['felya-favicon-black.svg', '5b37176e535c39c1dd7fc0fd42a7a24fcc564d28a9a15fc6192c911022f0b349'],
  ['felya-favicon-white.svg', '3ccc9aa3ec882f6adeaf5a2b7be630c58330889a4eb06efeb9c90bc05cdda984'],
  ['favicon-16x16.png', 'aa22c94de397a9c070b38c3298b03d76fd27be33c356188026ee156ebb02c04d'],
  ['favicon-32x32.png', 'abdc48d89d9e32078019c131b4bf6a96b9fb23c9f414a5be80bbf7f9995a56f5'],
  ['favicon-48x48.png', '3c54647f2e996c8faddea3655ad23520397649a10af0a1bd03d19967a86a2768'],
  ['favicon-96x96.png', '65ab517ebcbc14f4f77b67f901ac1a0ca987df7ab4c585e2740a98f6e694bad7'],
  ['favicon-256x256.png', '6ee9b77ee45890dd3c47c5b4ad8fef1a6373f45d49b02d5733363fa1583a0c2c'],
  ['apple-touch-icon.png', 'a325f490e3fdbf6e601632120db28f3d0f9dcd169a7c7e215cd3fc02a2b47315'],
  ['android-chrome-192x192.png', 'f9a3237a3638d8c1dc5df1f2aa26899c1a152cb8f1f346d054534b656597d2ed'],
  ['android-chrome-512x512.png', 'ba461c5c11e794e647bb0a26288fb00366d3800f91a19f9b11f8fd16e2d22ff6'],
  ['android-chrome-maskable-512x512.png', 'f658827654375ca40c0edf03fd611a5514476004549033f50ac5c60a4900eed3'],
  ['favicon.ico', '6f13d0d11e98d7833ef07966af8b3f5a1ecc68a5b77326e5fee8aa21e0ba1e69'],
  ['site.webmanifest', '408fe608b28097b2e531c5dc2e6ab864250ed3f66a78f0e628cb4206f654c074']
]);
for (const [fileName, expectedHash] of frozenFaviconFiles) {
  const contents = await fs.readFile(path.join(faviconRoot, fileName));
  if (sha256(contents) !== expectedHash) throw new Error(`V5 FAVICON PACKAGE: FAIL (${fileName})`);
}
const rootIco = await fs.readFile(path.join(root, 'public/favicon.ico'));
if (sha256(rootIco) !== frozenFaviconFiles.get('favicon.ico')) throw new Error('V5 FAVICON ROOT ICO: FAIL');

const alphaShape = async (input) => {
  const { data, info } = await sharp(input, { density: 300, limitInputPixels: false }).ensureAlpha().extractChannel('alpha').raw().toBuffer({ resolveWithObject: true });
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = 0; y < info.height; y += 1) for (let x = 0; x < info.width; x += 1) if (data[y * info.width + x] > 8) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
  return sharp(data, { raw: info }).extract({ left, top, width: right - left + 1, height: bottom - top + 1 }).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).raw().toBuffer();
};
const pyra = await alphaShape(path.join(sourceRoot, 'pyra.svg'));
for (const fileName of ['felya-favicon-black.svg', 'felya-favicon-white.svg']) {
  const favicon = await alphaShape(path.join(faviconRoot, fileName));
  let intersection = 0, union = 0;
  for (let index = 0; index < pyra.length; index += 4) { const a = pyra[index + 3] > 8; const b = favicon[index + 3] > 8; if (a && b) intersection += 1; if (a || b) union += 1; }
  if (intersection / union < 0.98) throw new Error(`V5 PYRA FAVICON GEOMETRY: FAIL (${fileName})`);
}

const layout = await fs.readFile(path.join(root, 'src/layouts/BaseLayout.astro'), 'utf8');
const lightIcon = '<link rel="icon" type="image/svg+xml" href="/assets/favicon/felya-favicon-black.svg" media="(prefers-color-scheme: light)">';
const darkIcon = '<link rel="icon" type="image/svg+xml" href="/assets/favicon/felya-favicon-white.svg" media="(prefers-color-scheme: dark)">';
if (!layout.includes(lightIcon) || !layout.includes(darkIcon) || !layout.includes('<link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/apple-touch-icon.png">') || !layout.includes('<link rel="manifest" href="/assets/favicon/site.webmanifest">')) throw new Error('V5 FAVICON HEAD CONTRACT: FAIL');
const manifest = JSON.parse(await fs.readFile(path.join(faviconRoot, 'site.webmanifest'), 'utf8'));
if (manifest.icons?.find((icon) => icon.purpose === 'maskable')?.src !== 'android-chrome-maskable-512x512.png') throw new Error('V5 FAVICON MASKABLE CONTRACT: FAIL');

console.log('V5 SOURCE MASTERS AND WEBSITE EXPORTS: PASS');
console.log('V5 WORDMARK PROVENANCE: PASS');
console.log('V5-COMPATIBLE FAVICON PACKAGE: PASS');
console.log('V5 PYRA-TO-FAVICON GEOMETRY: PASS');
console.log('FAVICON PLATFORM AND HEAD CONTRACT: PASS');
