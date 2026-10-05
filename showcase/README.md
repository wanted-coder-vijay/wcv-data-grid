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

Routes: `/`, `/playground`, `/docs`. The Vercel rewrites preserve direct links. Playground state lives in memory; shared URLs include only validated appearance and feature configuration, never user-edited rows. Demo operations update sample browser state; no production data is read or written.

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

Use `showcase/vercel.json` rewrites and headers at the root of the Vercel source upload, adjusted to these build settings. The repository's deployment payload script prepares only explicit public source, configuration, and the two referenced screenshots. It never includes credentials, node_modules, environment files, or other workspace content.
