# FELYA Website — Production

[![FELYA PATON — Anywhere on Earth](docs/assets/readme-header-anywhere-on-earth.png)](https://felya.com)

Published production snapshot of the multilingual FELYA website at [felya.com](https://felya.com).

## Repository role

This public repository is an automated deployment mirror. The canonical source is the private [`felya-labs/felya-website-stage`](https://github.com/felya-labs/felya-website-stage) repository.

Every push to `felya-website-stage/main` is verified and synchronized here by GitHub Actions. A successful snapshot commit triggers this repository's Pages workflow and deploys the static Astro build to the production domain.

Do not make editorial or application changes directly in this repository. Changes belong in the Stage repository and reach production through the verified snapshot pipeline.

## Deployment contract

- Source branch: `felya-website-stage/main`
- Snapshot branch: `felya-website-public/main`
- Production URL: [felya.com](https://felya.com)
- Build origin: `SITE_URL=https://felya.com`
- Hosting: GitHub Pages

The production CNAME, Pages workflow, and this README are maintained in this repository and preserved when source snapshots are synchronized.

The generated site contains localized routes, canonical and social metadata, `hreflang`, legal pages, `robots.txt`, and `sitemap.xml`. The initial page load uses first-party assets and does not load analytics, remote fonts, or remote embeds.
