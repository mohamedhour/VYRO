# VYRO Fashion

VYRO is a React/Vite storefront with an Express API for customer accounts, orders, promotions, try-on, and the AI stylist. The Node/MySQL catalog and admin API lives in `backend/`. In production, one Node service serves the built website and both API layers from the same public URL.

## Run locally

1. Install frontend/API dependencies: `npm install`, then `npm install --prefix backend`.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` if you want the AI stylist. The MySQL API uses `backend/.env`; copy `backend/.env.example` there and fill in the local database settings.
3. Start MySQL and load `backend/database/schema.sql`, `seed.sql`, and `migrations/002_admin_dashboard.sql` in order.
4. Start the frontend and stylist API with `npm run dev`. Vite serves the site on port 5173; the MySQL API runs separately with `npm start --prefix backend` on port 8000.

## Deploy a public demo

The included `render.yaml` creates a public Render web service. It builds the Vite app, serves it with Express, and mounts the Node/MySQL API under the same origin. Render assigns the site an `onrender.com` link. A free Render web service can spin down while idle, so the first visit after inactivity may take longer.

The backend needs a cloud MySQL-compatible database; the local XAMPP database cannot be reached by a public server. One low-cost starting option is TiDB Cloud Starter, which speaks the MySQL protocol. Create a MySQL-compatible Starter cluster, create a `vyro_db` database, then import the three SQL files above. Use the cluster's connection details in the Render environment variables (`VYRO_DB_HOST`, `VYRO_DB_NAME`, `VYRO_DB_USER`, and `VYRO_DB_PASS`). The Blueprint sets port `4000` and TLS on for TiDB. The free database quota has limits; check the provider's current plan before relying on it for production traffic.

Connect this repository to Render and create a Blueprint from `render.yaml`. Render will prompt for the database connection fields and generate the session secret. Add `GEMINI_API_KEY` in Render's Environment page to enable the stylist. Do not put real credentials in this file, GitHub, or `render.yaml`.

The public page uses the seed catalog in the cloud database. Local XAMPP records and local uploads are not copied by this setup. The customer account and promotion demo endpoints currently store some state in local JSON files, so they are suitable for a demo rather than persistent production orders; the catalog/admin order APIs use MySQL.

## Project layout

- `src/` — storefront UI and API clients
- `public/assets/` — storefront images and icons
- `server.ts` — Express app for the stylist and customer demo APIs; in production it also serves `dist/` and mounts `backend/server.js`
- `backend/server.js` — Express + MySQL API
- `backend/database/` — schema, seed data, and admin migration
- `render.yaml` — Render deployment blueprint
- `archive/` — inactive legacy site; excluded from the public repository
