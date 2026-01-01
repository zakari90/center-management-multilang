# Center Management (Multilang PWA)

## Overview
A multilingual, offline-first PWA built with Next.js (App Router), Prisma, and `next-intl`.

## Tech Stack
- Next.js 15
- React 19
- TypeScript
- Prisma
- MongoDB
- `next-intl` (translations in `dictionary/`)
- Serwist (service worker / PWA)
- Dexie (IndexedDB) for offline storage (project contains Dexie-related modules)

## Requirements
- Node.js (recommended: 18+ or 20+)
- pnpm (recommended) or npm
- A MongoDB instance (local or hosted)

## Getting Started
### 1) Install dependencies
```bash
pnpm install
```

### 2) Configure environment variables
Create a `.env` file at the project root (you already have one in this repo). Ensure it contains at least your database connection.

Common variables in this kind of setup:
- `DATABASE_URL` (Prisma connection string)
- Auth/JWT related secrets (if enabled in your app)

If you want, tell me what your app expects in `.env` and I’ll document the exact keys.

### 3) Prisma
Generate Prisma client:
```bash
pnpm run build
```

Note: `build` runs `prisma generate` and then `next build`.

If you use migrations in your workflow, you may also run (only if applicable to your setup):
```bash
pnpm prisma migrate dev
```

### 4) Run the dev server
```bash
pnpm dev
```

Open:
- `http://localhost:3000`

## Scripts
- `pnpm dev`
  - Runs Next.js in development
- `pnpm build`
  - Runs `prisma generate` then `next build`
- `pnpm start`
  - Starts the production Next.js server
- `pnpm lint`
  - Runs Next.js lint
- `pnpm test`
  - Runs `vitest run`

## Internationalization (i18n)
- Translations live in:
  - `dictionary/ar.json`
  - `dictionary/en.json`
  - `dictionary/fr.json`
- Next.js routing uses a locale segment:
  - `src/app/[locale]/...`

## PWA / Service Worker
This project uses Serwist.
- Source:
  - `src/worker/index.ts`
- Output:
  - `public/sw.js`

In `next.config.ts`, Serwist is disabled in development and enabled in production builds.

## Project Structure (high level)
- `src/app/`
  - Pages, routes, and layouts (App Router)
- `src/components/`
  - UI components
- `src/lib/`
  - Shared logic (API clients, offline/sync utilities, etc.)
- `src/i18n/`
  - i18n setup
- `prisma/schema.prisma`
  - Prisma schema

## Notes
- This repo contains several design/analysis documents at the project root (e.g. offline-first/sync/auth analyses). You can link or summarize them here if you want.

## License
Private / internal project (update if needed).
