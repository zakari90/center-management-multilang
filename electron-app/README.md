# Center Management - Electron App

Desktop application for center management system built with Electron and React.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy Prisma schema:
```bash
cp -r ../prisma ./prisma
```

3. Copy environment variables:
```bash
cp ../.env.example .env
# Edit .env with your DATABASE_URL
```

4. Generate Prisma client:
```bash
npx prisma generate
```

## Development

Run all services (renderer, main process, and server):
```bash
npm run dev
```

Or run individually:
- `npm run dev:renderer` - Vite dev server (React app)
- `npm run dev:main` - TypeScript compiler for main process
- `npm run dev:server` - Express API server

## Build

Build for production:
```bash
npm run build
```

Create distributable:
```bash
npm run dist          # All platforms
npm run dist:win      # Windows only
npm run dist:mac      # macOS only
npm run dist:linux    # Linux only
```

## Project Structure

```
electron-app/
├── main/              # Electron main process
├── server/            # Express API server
├── src/              # React renderer app
├── lib/              # Shared utilities (DB, auth)
├── prisma/           # Prisma schema (copy from root)
└── dist/             # Build output
```

