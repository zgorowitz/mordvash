# Invoice Desk

A small Clerk-protected Next.js invoice workspace for client folders, invoice editing, PDF download, vendor presets, and invited-email access.

## Data

Starter data lives in `data/app-state.json`.

Runtime storage is handled through `/api/app-state`:

- `DATA_STORAGE=file` writes `data/app-state.json` during local development
- `DATA_STORAGE=github` writes `data/app-state.json` through GitHub when `GITHUB_TOKEN` is configured
- `DATA_STORAGE=browser` keeps edits in browser storage

On Vercel, use `github` or a real database for durable shared storage. Plain SQLite or file writes inside the deployed app are not durable on Vercel serverless infrastructure.

## Access

Clerk handles sign-in. The app then checks the signed-in email against the invitation list in Settings. Seeded invited emails are stored in `data/app-state.json`, and `NEXT_PUBLIC_INVITED_EMAILS` can add environment-seeded owners.

## Development

```bash
npm install
npm run dev
```

```bash
npm run build
```
