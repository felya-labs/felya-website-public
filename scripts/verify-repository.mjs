import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);
const required = [
  'src/components/PrototypesSection.astro',
  'src/components/PartnersSection.astro',
  'src/components/FuturesSection.astro',
  'src/components/DevelopmentUpdatesSection.astro',
  'src/components/PointOfViewSection.astro',
  'src/components/system/PatonSystemDemonstration.astro',
  'src/components/SiteScripts.astro',
  'src/scripts/site.js',
  'src/scripts/site-config.js',
  'src/scripts/hero-headline-translations.js',
  'public/assets/images/possible-futures/sketches/webp',
  'public/assets/images/partners',
  'public/assets/images/system/operator',
  'public/assets/images/video-cover',
  'assets-source/possible-futures/legacy/blueprints',
  'assets-source/possible-futures/archive/webp',
  'assets-source/system/openarm',
  'assets-source/video/interface-of-craft-thumbnail.png'
];

await Promise.all(required.map((path) => access(new URL(path, root))));

const staleNames = /IterationSection|SponsorMarquee|VisionSection|SignupSection|TeamSection|PatonDesktopDemonstration|images\/sponsors|paton-operator-blueprint|#iteration|id="iteration"/;
const scanRoots = ['src', 'public/assets/js'];

async function scan(directory) {
  const entries = await readdir(new URL(`${directory}/`, root), { withFileTypes: true });
  for (const entry of entries) {
    const relative = join(directory, entry.name);
    if (entry.isDirectory()) await scan(relative);
    else if (/\.(?:astro|css|js|mjs)$/.test(entry.name)) {
      const content = await readFile(new URL(relative, root), 'utf8');
      if (staleNames.test(content)) throw new Error(`Stale internal name in ${relative}`);
    }
  }
}

await Promise.all(scanRoots.map(scan));

const localeSource = await readFile(new URL('src/i18n/config.ts', root), 'utf8');
const runtimeSource = await readFile(new URL('src/scripts/site-config.js', root), 'utf8');
const extractList = (source, expression, label) => {
  const match = source.match(expression);
  if (!match) throw new Error(`Unable to read ${label}`);
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((item) => item[1]);
};
const configuredLocales = extractList(localeSource, /export const locales = \[([^\]]+)\]/s, 'configured locales');
const runtimeLocales = extractList(runtimeSource, /languages:\s*\[([^\]]+)\]/s, 'runtime locales');
if (JSON.stringify(configuredLocales) !== JSON.stringify(runtimeLocales)) {
  throw new Error(`Runtime locale drift: config=${configuredLocales.join(',')} runtime=${runtimeLocales.join(',')}`);
}

const publicArchiveNames = /paton-glove-(?:handshake|pov|suit)|robot-rubber-chicken|openarm-bottle-color/;
const publicSketches = await readdir(new URL('public/assets/images/possible-futures/sketches/webp/', root));
const leakedArchive = publicSketches.find((name) => publicArchiveNames.test(name));
if (leakedArchive) throw new Error(`Archived sketch returned to the production tree: ${leakedArchive}`);

console.log('Repository references verified.');
