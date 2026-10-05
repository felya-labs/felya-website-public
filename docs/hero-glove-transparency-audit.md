# Hero Glove Transparency and Theme Wipe Audit

## Scope and result

The PATON Hero glove is a single transparent image layer. The visible rectangular field was not embedded in that image: it was `.hero-product-stage::before`, a large blurred gradient behind the image. Its independent clip-path animation only approximated the page-wide theme wipe, so the field was especially apparent during theme changes. The field has been removed.

The product keeps its alpha-aware `drop-shadow`; its small elliptical contact shadow remains below the product and does not participate in the theme wipe.

## Asset alpha analysis

The rendered source is `public/assets/images/hero/paton-glove/paton-glove-light-premium-v1.webp` (1200 × 1343 WebP with alpha). `HeroSection.astro` deliberately uses it in both themes. `paton-glove-dark-premium-v1.webp` exists at the same dimensions but is not rendered.

| Asset | Exterior-edge alpha | Non-zero-alpha bounds | Fully transparent pixels | Near-transparent average RGBA |
| --- | --- | --- | --- | --- |
| `light-premium-v1.webp` | 0–0 | 67, 51–1085, 1305 | 916,717 | 90.5, 112.8, 122.1, 6.1 |
| `dark-premium-v1.webp` | 0–0 | 67, 51–1084, 1287 | 929,817 | 129.4, 128.2, 130.3, 5.7 |

Fully transparent pixels average approximately RGB 4, 4, 4 in both assets. The transparent border is therefore genuine, not a white or dark rectangular matte. Semi-transparent edge pixels are limited to the glove silhouette. Local composites on white, black, 50% gray, and magenta contrast backgrounds showed no rectangular image field; they are retained outside the repository in `/private/tmp/felya-hero-glove-audit/glove-alpha-contrast/`.

## Previous visible-layer architecture

| Layer | Element / selector | Theme behavior and transition |
| --- | --- | --- |
| Product cutout | `img.hero-product-image` inside `.hero-product-composite.hero-scroll-glove` | One preloaded, eagerly requested transparent light WebP in both themes; no source switch, mask, opacity fade, blend mode, or independent wipe. |
| Product shadow | `.hero-product-composite` | Alpha-aware `drop-shadow()` changes only its color between themes; it follows the cutout alpha and cannot paint the image rectangle. |
| Contact shadow | `.hero-product-stage::after` | A low, blurred elliptical shadow below the glove; z-index 0, not theme-wiped. |
| Removed background field | `.hero-product-stage::before` | A blurred gradient larger than the image box. It was visible in light mode and independently clip-path-animated on each theme transition. This was the rectangular field. |
| Page wipe | `.hero-section::after` | A z-index 0 light-background pseudo-element behind the earth (1) and composition (2), clipped left-to-right for light-to-dark and right-to-left for dark-to-light. |

The stage is `position: relative; isolation: isolate`; the product composite is z-index 1, with the remaining contact shadow at z-index 0. There are no glove-specific masks, `clip-path`s, background images, `mix-blend-mode`, or image decoding/source-switch hooks after the fix; the only remaining stage pseudo-element is the elliptical contact shadow.

## Theme-wipe root cause and new architecture

`initColorTheme()` immediately changes `data-theme` and sets `data-theme-wipe-direction` for normal motion. `.hero-section::after` then animates its clip-path for 600 ms using `cubic-bezier(.4, 0, .2, 1)`: `ltr` hides the light page backdrop from left to right, and `rtl` reveals it from right to left. Reduced motion changes the theme without the direction attribute or animation.

Previously the Glove stage ran a second, full rectangular wipe over the blurred `::before` field. It shared the duration but not the global wipe geometry: its extent was tied to the product stage, so its moving edge could never exactly coincide with the page-wide wipe boundary. The fix removes that separate field and its animation. The transparent cutout now remains live above the single global background wipe, with no additional glove wipe, crossfade, or rectangular compositing layer.

## Frame capture comparison

Twenty baseline captures and twenty post-fix captures cover 0%, 25%, 50%, 75%, and 100% of the 600 ms transition for desktop and mobile in both directions. They were captured at desktop DPR 2 and mobile DPR 3 under:

- `/private/tmp/felya-hero-glove-audit/baseline-frames/`
- `/private/tmp/felya-hero-glove-audit/fixed-frames/`

The baseline shows the stage-sized gradient participating in the wipe. The post-fix set contains only the globally clipped Hero backdrop behind the alpha-cutout; glove position, size, and alpha edge remain unchanged at every frame.

## Changed files

- `src/styles/global.css` — removed the rectangular light gradient pseudo-element and its separate theme-wipe animation.
- `docs/hero-glove-transparency-audit.md` — this audit.
