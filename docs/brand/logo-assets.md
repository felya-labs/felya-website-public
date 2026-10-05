# FELYA website logo assets

## V5 source and web outputs

The website uses the verified V5 masters copied from `brand-assets` commit
`773c20a4fd42e6b984d0f85e5cff1ac130a44300`:

| Master | Website outputs |
| --- | --- |
| `source/logo-v5/pyra.svg` | `felya-mark-{black,white}.{svg,png}` |
| `source/logo-v5/felya-horizontal.svg` | `felya-logo-horizontal-{black,white}.{svg,png}` |
| `source/logo-v5/felya-vertical.svg` | `felya-logo-vertical-{black,white}.{svg,png}` |

The source SVGs are preserved byte-for-byte in `assets-source/brand/source/logo-v5/`.
Website SVG outputs only replace `currentColor` with explicit black or white so
they are correct when loaded as external images. PNGs are lossless web exports
from those SVGs. No optical compensation or alternative negative geometry is
applied.

Header and footer use the horizontal lockup. Their CSS frame width increases by
5.6% only to preserve the previous visible logo size after adopting the V5
master's intentional clearspace. The header, footer, mobile navigation and legal
pages otherwise retain their existing layout.

The square Organisation JSON-LD logo tiles remain byte-identical: V5 does not
change Pyra geometry, so re-encoding them would add no visual or provenance value.

## Social preview

`public/assets/brand/felya-labs-paton-social-preview-1200x630.jpg` is rebuilt
from the V5 positive horizontal lockup while retaining its existing text, product,
background, layout and colour system. It remains the Open Graph and Twitter image.

Run `node scripts/build-v5-brand-assets.mjs` to reproduce the website logo
outputs and social preview. The command intentionally does not touch the
favicon package or Organisation-logo tiles.

## V5-compatible favicon package

The Pyra itself is unchanged between the prior website implementation and V5.
The existing favicon package is therefore an official V5 application, not a
newly designed V5 icon family. Its canonical copy is
`brand-assets/01_Logo Master/07 Favicon V5 Application/`.

Browser tabs use the transparent black and white SVGs selected by browser/OS
`prefers-color-scheme`, independently of the website theme. Apple Touch,
Android, maskable PNGs and both ICO copies retain the established white-Pyra
with black F050 edge treatment. Padding, outline, safe area, sizes, formats and
browser selection behavior remain unchanged.

The verification script locks every favicon file hash, confirms platform links
and manifest behavior, and compares both browser SVG silhouettes with the V5
Pyra master. This deliberately validates compatibility without regenerating any
favicon binary.
