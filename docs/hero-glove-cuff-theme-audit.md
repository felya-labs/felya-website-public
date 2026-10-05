# Hero Glove Cuff Theme Flash Audit

## Root cause

The lower cuff flash was local CSS overlay behavior (classification A), not a
Glove asset or two-image overlap. The relevant layer is
.hero-product-stage::after: a blurred, elliptical contact shadow at z-index 0
below the z-index 1 transparent Glove image.

Before the fix, its theme values changed synchronously with data-theme:

| State | Background | Blur | Opacity | Desktop geometry |
| --- | --- | --- | --- | --- |
| Light | rgba(29, 40, 56, .13) | 32px | .70 | right 9%, width 44%, height 10% |
| Dark | rgba(0, 0, 0, .34) | 28px | .72 | right 10%, width 42%, height 11% |

At the click and at the first measured 0 ms, 16 ms, and 50 ms frames, the
Dark values were already active while the global Hero wipe direction was still
active. The darker, slightly larger shadow is located directly under the wrist
and cuff, explaining the local early dark flash.

## Computed-style and layer result

The stage contains one .hero-product-image only. It has no filter; the product
composite has the already-neutral alpha-bound drop-shadow. The cuff overlay has
normal blend mode, no clip path, no mask, and no image background. There is no
second theme image, no alpha accumulation, and no Glove cutout overlap.

The Light WebP cuff-region semi-transparent pixels average RGBA 70.9, 72.7,
72.6, 109.4; the unused Dark asset averages 106.0, 102.2, 103.6, 26.3. Their
different edge distributions cannot cause the observed flash because only the
Light asset is rendered in both themes.

## Fix and result

The existing Light contact-shadow values are now the single neutral
.hero-product-stage::after definition. Therefore its color, blur, opacity, and
desktop geometry do not change at the theme state switch. The global Hero
background remains the only directional wipe; no new animation, layer, asset,
or compositing work was added.

Local captures cover before-click, 0 ms, 16 ms, 50 ms, 10%, 25%, 50%, 75%, and
100% for both directions on desktop DPR 2 and mobile DPR 3:

- Baseline: /private/tmp/felya-hero-glove-audit/baseline-cuff-frames/
- Fixed: /private/tmp/felya-hero-glove-audit/fixed-cuff-frames/

Before, the first erroneous frame was 0 ms on Light to Dark. After the fix,
the cuff shadow computed style is invariant across every captured frame, so
there is no local pre-wipe change.
