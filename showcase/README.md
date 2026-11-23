# Dynostack Grid showcase

Live: https://dynostack-react-grid.vercel.app

## Local development

From the package root:

```sh
npm install
npm run build
npm install --prefix showcase
npm run showcase:dev
```

The showcase uses `file:..` to exercise the actual library build. Rebuild the library after changing its source. Vite deduplicates React, React DOM, and TanStack Table to support local package linking.

Routes: `/`, `/playground`, `/docs`. The production build prerenders each route to its own HTML file. Vercel rewrites preserve direct links and serve the matching document. Playground state lives in memory; shared URLs include only validated appearance and feature configuration, never user-edited rows. Demo operations update sample browser state; no production data is read or written.

## Verification

```sh
npm run typecheck
npm run build
npm test
npm run showcase:build
npm audit
npm audit --prefix showcase
```

The homepage uses pointer-driven spring tilt and a draggable spring-return feature chip. Reduced-motion preferences disable the hero transform and transitions. Both docs and playground layouts adapt to phone screens; wide tables scroll inside their own viewport.

## Deployment

This project was deployed through the authenticated Vercel connector with source files, a root build of the package, and the showcase build output `showcase/dist`. A source deployment needs both `src/` and `showcase/` because of the local dependency. Set:

```text
Install command: npm install
Build command: npm run build && npm install --prefix showcase && npm run build --prefix showcase
Output directory: showcase/dist
```

Use `showcase/vercel.json` rewrites and headers at the root of the Vercel source upload, adjusted to these build settings. The repository's deployment payload script prepares only explicit public source, configuration, the crawl files, prerender build script, and referenced screenshots. It never includes credentials, node_modules, environment files, or other workspace content.

## Search discovery

`npm run build --prefix showcase` renders the real React pages into static HTML for `/`, `/playground`, and `/docs`, with unique titles, descriptions, canonical URLs, social previews and JSON-LD. Client navigation updates the same metadata. Both browsers and crawlers receive the same content; no user-agent detection is used. Vite bundles a build-only SSR entry to avoid duplicate React instances across the local package link. The interactive app mounts over the static document after JavaScript loads.

`src/seo.ts` is the source for page metadata and structured data. `public/sitemap.xml` lists the canonical public routes, and `public/robots.txt` advertises it. The production origin is `https://dynostack-react-grid.vercel.app`; update metadata and both crawl files together if the domain changes. New products should receive a real public page, metadata and a sitemap entry once shipped.

Run `npm run test:seo` from the package root after building the showcase. `tests/seo.browser.mjs` additionally checks JavaScript-disabled pages, direct routes, client navigation and browser errors against a running production preview. Set `SEO_BASE_URL` for a deployed site and `PLAYWRIGHT_MODULE` for a Playwright installation outside this checkout.

After deploying:

1. Add `https://dynostack-react-grid.vercel.app/` as a URL-prefix property in Google Search Console. Verify ownership using Google's supplied HTML file or meta tag; never invent a verification token.
2. Submit `https://dynostack-react-grid.vercel.app/sitemap.xml` and inspect the home, docs and playground URLs. Use Request indexing after Google's live test succeeds.
3. Review indexing exclusions and Google-selected canonical URLs. Google decides whether and when to index; there is no guaranteed ranking or timetable.
4. Publish the next approved npm release to carry the updated brand description, keywords and README to the registry. We cannot edit npmjs.com's canonical tags or submit indexing requests for a domain we do not own.

Official guidance: [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [request a recrawl](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [site names](https://developers.google.com/search/docs/appearance/site-names).


## Editing, state and views lab

In `/playground`, Rows & interactions exposes validation, delayed saves, forced
failures, application-controlled state, named saved views and browser persistence.
The lab includes a state inspector and explicit reset/clear controls. The Code
tab and shared URLs include the options. Saved views persist only configuration,
never rows; clear them with Clear saved views. Playground Reset preserves saved
presets. See `/docs` sections Reliable editing, Controlled state, Saved views and
Feature roadmap. These source APIs are newer than npm 0.5.2.

With a Playwright installation available:

```powershell
$env:PLAYWRIGHT_MODULE = 'path/to/playwright'
$env:EDITING_BASE_URL = 'http://127.0.0.1:5186'
$env:STATE_BASE_URL = 'http://127.0.0.1:5186'
npm run showcase:dev -- --port 5186
# In another terminal using the same environment:
npm run test:editing
npm run test:state
```

Tests cover validation, pending saves, cancellation, failed-save retry, complete
and partial controlled state, read-only slices, saved-view scope, persistence,
rename/delete/reset/clear, malformed-storage recovery and public playground
integration. Screenshots go into `evidence/`. Full visual baselines remain a
separate roadmap item.


The playground also exposes Keyboard cell navigation, Virtualize loaded rows,
10,000 and 50,000 sample rows, Native XLSX export, numeric formatting and an extra worksheet.
Virtualization switches pagination off when enabled; opening expanded details
remains virtualized. Editing rows stay mounted while scrolling. ExcelJS is
loaded only for native export through the optional /xlsx adapter.
`npm run test:advanced` verifies keyboard use, horizontal save buttons, spinner,
notifications, expansion placement, bounded virtual DOM and actual downloaded
workbook contents. `ADVANCED_BASE_URL` can point to production. The separate XLSX
round-trip test runs with `npm test`. npm 0.5.2 still predates these source APIs.

Details panel Edit/Delete switches and a layout selector map to `viewSheet` props. Add row starts a blank draft: enter required values, save or cancel; forced save failures retain the draft. Named views restore table settings, not data snapshots. The docs explain all three flows.

Run `node tests/details-add.browser.mjs` with `PLAYWRIGHT_MODULE` set to your Playwright installation; `DETAILS_BASE_URL` can target a built preview or production. It verifies scrollbar parity, blank draft validation/retry/cancel, single insertion, details actions, delete confirmation and mobile layout.

`npm run test:performance` exercises 50,000 rows, control responsiveness during preparation, bounded DOM while expanded, scrolling, editing the final row, cancellation of stale preparation, themed editors and API search. It records measured results in `evidence/performance-50000.json`; `PERFORMANCE_BASE_URL` may target production. The generated Complete API reference lists all source props/types and pairs each feature with implementation/handler guidance. Regenerate with `npm run docs:generate`; showcase builds regenerate automatically.
