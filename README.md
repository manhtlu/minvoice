# minvoice

Personal finance app — local-first PWA built with Vue 3 + Vite + IndexedDB (Dexie.js).

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

Hosted on **Vercel**, auto-deploy from `main` branch.

- Push to `main` triggers a new production deploy.
- Preview deploys are created for other branches/PRs.
- SPA routing handled via `vercel.json` rewrites.

```bash
git push origin main
```
