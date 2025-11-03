# Electron App Setup Instructions

## Step 1: Copy Required Files

Run these commands from the project root to copy necessary files:

```bash
# Copy Prisma schema
cp -r prisma electron-app/

# Copy dictionary files for i18n
cp -r dictionary electron-app/

# Copy public assets (icons, etc.)
mkdir -p electron-app/public
cp public/icon-*.png electron-app/public/ 2>/dev/null || true

# Copy UI components (you'll need to copy these manually or adapt them)
# The basic structure is in place, but you may want to copy:
# - src/components/ui/* -> electron-app/src/components/ui/*
```

## Step 2: Copy UI Components

Since you have many Radix UI components, you can either:

**Option A:** Copy all UI components (recommended for quick setup):
```bash
cp -r src/components/ui electron-app/src/components/
```

**Option B:** Create minimal UI components as needed.

## Step 3: Install Dependencies

```bash
cd electron-app
npm install
```

## Step 4: Set Up Environment

```bash
# Copy .env file or create one
cp ../.env electron-app/.env

# Make sure DATABASE_URL is set in .env
```

## Step 5: Generate Prisma Client

```bash
cd electron-app
npx prisma generate
```

## Step 6: Build Preload Script

The preload script needs to be compiled separately. Update `package.json` to include:

```json
"build:preload": "tsc --project tsconfig.preload.json"
```

And create `tsconfig.preload.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2020",
    "outDir": "./dist",
    "noEmit": false
  },
  "include": ["main/preload.ts"]
}
```

## Step 7: Run Development

```bash
npm run dev
```

This will start:
- Vite dev server for React (port 5173)
- Express API server (port 3001)
- Electron main process

## Next Steps

1. **Copy Components**: Gradually copy components from `src/components/` to `electron-app/src/components/`
2. **Adapt Components**: Update imports from `next/navigation` to `react-router-dom`
3. **Update i18n**: Components using `next-intl` need to use `react-i18next` instead
4. **Test Features**: Test each feature as you migrate components

## Important Notes

- The API client (`src/lib/apiClient.ts`) uses Electron IPC when available, falls back to HTTP
- Authentication is handled via Express sessions with cookies
- All Next.js specific features (middleware, API routes, server components) are moved to Express backend
- React Router is used instead of Next.js routing

