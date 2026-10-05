# Hero Glove Shadow Theme Transition Audit

## Root cause

The visible Glove shadow is the alpha-aware filter: drop-shadow() on
.hero-product-composite in src/styles/global.css. It is constrained to the
transparent product cutout. There are no box-shadows, shadow pseudo-elements,
blend modes, masks, gradients, or asset shadows involved.

Previously the Light theme used a 0 22px 34px rgba(19, 28, 42, .105)
drop-shadow plus a 0 6px 12px rgba(42, 66, 101, .055) drop-shadow. The Dark
theme instead used a 0 22px 34px rgba(0, 0, 0, .24) drop-shadow.

initColorTheme() changes data-theme synchronously when the Theme button is
clicked. The global Hero backdrop then starts its 600 ms directional clip-path
wipe through .hero-section::after. Consequently the shadow filter changed at
frame 0 while the wipe direction attribute remained active: it was not part of
the global wipe.

## Option decision

Option A would require a second, separately masked shadow layer to match the
page-wide wipe boundary. No global wipe-progress value exists to reuse, and
that layer would add the compositing complexity the Hero avoids. Option B would
only approximate that boundary with a timed filter transition, so it could
still lead or trail on desktop and mobile.

Option C is selected. The existing subtle Light shadow is now the single
neutral shadow for both themes. Light is visually unchanged. Dark changes from
the stronger black .24 shadow to the same restrained, alpha-bound two-part
shadow. It remains a form-bound product edge treatment without changing when
the theme is clicked.

## Frame capture result

Local captures cover before-click, click, 10%, 25%, 50%, 75%, and 100% for
Light to Dark and Dark to Light on desktop DPR 2 and mobile DPR 3:

- Baseline: /private/tmp/felya-hero-glove-audit/baseline-shadow-frames/
- Fixed: /private/tmp/felya-hero-glove-audit/fixed-shadow-frames/

Baseline filter values switched immediately at the click in both directions.
After the change, the computed filter remains identical before, during, and
after every transition. The Hero background keeps its existing single global
wipe, with no new layer or animation.
