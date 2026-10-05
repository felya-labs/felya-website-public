# Performance integration on current Preview

## Basis and scope

- Current Preview base: `734c208140772fe29e9416746a9821e0076dd754`
- Previous tested performance reference: `88d20927b19a21bb587dedc0537a18fcd32a6245`
- Integration branch: `perf/preview_performance_current`

The current Preview base is authoritative. No source files from the older
Preview basis were restored wholesale.

## Conflict matrix

| File area | Current Preview change | Performance change | Resolution |
|---|---|---|---|
| `src/styles/global.css` | V4 header/favicons refinement | partner and responsive Future styling | Both changes applied cleanly; current V4 rules remain in the base. |
| `src/layouts/BaseLayout.astro` | adaptive light/dark favicon links | none | Preserved unchanged from `734c208`. |
| `public/assets/favicon/` | V4 F050 adaptive favicon assets | none | Preserved unchanged from `734c208`. |
| team portrait assets | V4 team portrait refresh | none | Preserved unchanged from `dd1507f`. |
| `src/scripts/site.js` | none in the three current Preview commits | image loading, globe lifecycle/rate, hero gating, signal cache | Performance-only additions retained. |

## Applied performance features

- on-demand Partner variants
- responsive Future assets and bounded decode queue
- video-cover/native-poster reuse
- globe visibility/page-lifecycle suspension and 30 Hz compact projection
- hero-scroll gating
- compact signal geometry cache

The historic two-theme Hero source optimization remains deliberately excluded;
the current Hero architecture is already authoritative.

## Validation

`bun run verify` passes: repository references, current V4 brand geometry,
adaptive V4 browser favicon links, localization and the static production build.
`node scripts/verify-runtime-performance.mjs` passes lifecycle, compact globe
rate, resume, reduced-motion, duplicate-RAF and Hero-scroll invariants.

The prior comparable mobile measurements remain the performance reference:
full scroll about 2.00 MB, Partners about 0.63 MB, Future images about 0.28 MB,
and mobile main-thread median about 2360 ms. No complete new benchmark was run,
because the base delta contains only the three branding/team/favicon commits.
