import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const sourceDirectory = path.join(root, 'assets-source/possible-futures/source-sketches/png');
const runtimeDirectory = path.join(root, 'public/assets/images/possible-futures/sketches/webp');
const sha256 = (contents) => crypto.createHash('sha256').update(contents).digest('hex');

// The white masters are the unchanged, hand-drawn originals from
// brand-assets/06_Designstudien/Anwendung/Skizzen. The light-theme variants
// retain their turquoise line work while converting neutral drawing lines to
// black, matching the established Possible Futures asset contract. The remote
// sketch instead uses the approved presentation pair directly: its isolated
// chest Pyra has intentionally reduced opacity in both themes.
const masters = [
  {
    name: 'vr-hydrogen-engine-touch',
    whiteSha256: 'ceb3f26bd808825efa65c4aae2324603b18c1bb4079b05c26ef7fcd7e023a456',
    blackSha256: 'afd6e268985581e481db6b3566604de5042998957670afb2e5a7adcfcc3c0030'
  },
  { name: 'static-haptic', sha256: '3164eb17a14e3792d48172e56b36525730d55878dc85360f99f0508ff3c48db2' },
  { name: 'operator-vr-paton-glove', sha256: 'f94a73e43f0fc307a6125fdec34a653d844d0cae7f3fbd4227a204639e249cd4' }
];

async function buildLightThemeMaster(whiteMaster, blackMaster) {
  const { data, info } = await sharp(whiteMaster).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += info.channels) {
    const [red, green, blue, alpha] = data.subarray(offset, offset + 4);
    if (alpha === 0) continue;
    if (Math.max(red, green, blue) - Math.min(red, green, blue) <= 12) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
    }
  }

  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(blackMaster);
}

for (const master of masters) {
  const whitePng = path.join(sourceDirectory, `${master.name}-white.png`);
  const blackPng = path.join(sourceDirectory, `${master.name}-black.png`);
  const white = await fs.readFile(whitePng);
  if (sha256(white) !== (master.whiteSha256 ?? master.sha256)) {
    throw new Error(`Unexpected canonical master: ${master.name}-white.png`);
  }

  if (master.blackSha256) {
    const black = await fs.readFile(blackPng);
    if (sha256(black) !== master.blackSha256) {
      throw new Error(`Unexpected canonical master: ${master.name}-black.png`);
    }
  } else {
    await buildLightThemeMaster(whitePng, blackPng);
  }
  await Promise.all([
    sharp(whitePng).webp({ lossless: true, effort: 6 }).toFile(path.join(runtimeDirectory, `${master.name}-white.webp`)),
    sharp(blackPng).webp({ lossless: true, effort: 6 }).toFile(path.join(runtimeDirectory, `${master.name}-black.webp`))
  ]);
}

console.log('Published hatched-chest Pyra masters and lossless theme WebP assets.');
