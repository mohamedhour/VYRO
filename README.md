# VYRO Fashion

VYRO is a React/Vite storefront with an Express API for customer accounts, orders, promotions, try-on, and the AI stylist. The Node/MySQL catalog and admin API lives in `backend/`.

## Public preview

The storefront preview is deployed to GitHub Pages at <https://mohamedhour.github.io/vyro-fashion/>. It uses the sample catalog bundled with the frontend. Accounts, checkout, order tracking, the AI stylist, and the Node APIs are not connected in this static preview.

The `.github/workflows/pages.yml` workflow builds the site and publishes it whenever `main` changes. The Vite base path is set for this GitHub Pages project URL.

## Run locally

1. Install frontend/API dependencies: `npm install`, then `npm install --prefix backend`.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` if you want the AI stylist. The MySQL API uses `backend/.env`; copy `backend/.env.example` there and fill in the local database settings.
3. Start MySQL and load `backend/database/schema.sql`, `seed.sql`, and `migrations/002_admin_dashboard.sql` in order.
4. Start the frontend and stylist API with `npm run dev`. Vite serves the site on port 5173; the MySQL API runs separately with `npm start --prefix backend` on port 8000.

## Optional full-stack deployment

`render.yaml` describes a Render Node service for the frontend and API. It requires a public MySQL-compatible cloud database; a local XAMPP database cannot be reached from a public server. The setup notes use TiDB Cloud Starter as one MySQL-compatible option. Import `backend/database/schema.sql`, `seed.sql`, and `migrations/002_admin_dashboard.sql`, then provide the database connection details in the Render environment. Never put real credentials in this repository.

The full-stack demo stores some account and promotion state in local JSON files, so those records do not persist reliably across service restarts. Use a durable database-backed implementation before accepting real customer orders.

## Project layout

- `src/` — storefront UI and API clients
- `public/assets/` — storefront images and icons
- `server.ts` — Express app for the stylist and customer demo APIs; in production it serves `dist/` and mounts `backend/server.js`
- `backend/server.js` — Express + MySQL API
- `backend/database/` — schema, seed data, and admin migration
- `.github/workflows/pages.yml` — GitHub Pages static preview deployment
- `render.yaml` — optional Render deployment blueprint
- `archive/` — inactive legacy site; excluded from the public repository
