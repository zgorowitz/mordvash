# App Data

`app-state.json` is the repo-seeded invoice data file. It gives the app a readable source of truth for starter vendors, clients, invoices, and invited emails.

At runtime the app uses `/api/app-state` plus browser fallback storage:

- local development can write this file when `DATA_STORAGE=file`
- production can write the same file through GitHub when `DATA_STORAGE=github` and a GitHub token is configured
- without a writable backend, the browser keeps local edits so the app remains usable

Do not commit private invoice PDFs here. Keep this file for structured invoice/client data only.
