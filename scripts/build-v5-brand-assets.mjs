import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.join(root, 'assets-source/brand/source/logo-v5');
const logoRoot = path.join(root, 'public/assets/images/brand/felya-logo');
const publicBrandRoot = path.join(root, 'public/assets/brand');
const sha256 = (contents) => crypto.createHash('sha256').update(contents).digest('hex');

const masters = [
  { source: 'pyra.svg', stem: 'felya-mark', pngWidth: 1200, sha256: 'db062249ca74e99c510de058e2d2e7d38711943176a7aa096f8394f46bee446c' },
  { source: 'felya-horizontal.svg', stem: 'felya-logo-horizontal', pngWidth: 1800, sha256: '6b79774f998f2c8c5d01eb2dc499a00232d27a655ae44898f910c7a1bb195cdf' },
  { source: 'felya-vertical.svg', stem: 'felya-logo-vertical', pngWidth: 1200, sha256: 'dbb28ed0c403cee703aafaa560dd7bb8716021652a13f35a0efdca947b3caf87' }
];

const explicitColor = (source, color) => {
  const output = source.replace('fill="currentColor"', `fill="${color}"`);
  if (output === source || output.includes('currentColor')) throw new Error('Unable to create explicit-colour V5 SVG.');
  return output;
};

const rendered = new Map();
for (const master of masters) {
  const contents = await fs.readFile(path.join(sourceRoot, master.source));
  if (sha256(contents) !== master.sha256) throw new Error(`Unexpected V5 master hash: ${master.source}`);
  for (const [variant, color] of [['black', '#000000'], ['white', '#FFFFFF']]) {
    const svg = explicitColor(contents.toString('utf8'), color);
    await fs.writeFile(path.join(logoRoot, `${master.stem}-${variant}.svg`), svg);
    await sharp(Buffer.from(svg)).resize({ width: master.pngWidth }).png({ compressionLevel: 9 }).toFile(path.join(logoRoot, `${master.stem}-${variant}.png`));
    rendered.set(`${master.stem}-${variant}`, svg);
  }
}

const fontSource = path.join(root, 'public/fonts/manrope-variable.ttf');
const gloveSource = path.join(root, 'public/assets/images/hero/paton-glove/paton-glove-light-premium-v1-1200.webp');
const wordmark = await sharp(Buffer.from(rendered.get('felya-logo-horizontal-black'))).trim({ background: '#00000000' }).resize({ width: 160, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
const glove = await sharp(gloveSource).resize({ height: 490, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
const background = Buffer.from('<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#f7f8f9"/></svg>');
const text = async (value, fontSize, color, weight = 500) => sharp({ text: { text: `<span foreground="${color}" weight="${weight}">${value}</span>`, font: `Manrope ${fontSize}`, fontfile: fontSource, rgba: true } }).png().toBuffer();
const [paton, headlineOne, headlineTwo, signature] = await Promise.all([text('P A T O N', 17, '#3f60bd', 700), text('Your hands.', 62, '#090b0f', 700), text('Anywhere on Earth.', 62, '#555d68', 650), text('Natural movement. Physical feedback.', 22, '#2b313a', 500)]);

await sharp(background).composite([{ input: wordmark, left: 68, top: 50 }, { input: paton, left: 68, top: 177 }, { input: headlineOne, left: 68, top: 229 }, { input: headlineTwo, left: 68, top: 309 }, { input: signature, left: 68, top: 417 }, { input: glove, left: 694, top: 74 }]).withMetadata({ icc: 'srgb' }).jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true }).toFile(path.join(publicBrandRoot, 'felya-labs-paton-social-preview-1200x630.jpg'));

console.log('Generated V5 logo exports and the V5 social preview. Favicons and organisation-logo tiles were intentionally untouched.');
