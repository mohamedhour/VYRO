# VYRO Fashion

VYRO is a React/Vite storefront with an Express API for customer accounts, orders, promotions, try-on, and the AI stylist. The Node/MySQL catalog and admin API lives in `backend/`.

## Open the store

**Live full-stack store:** <https://vyro-fashion.hoursimo69.workers.dev>

The store, API, and database run on Cloudflare and TiDB, so customers can browse and place orders even when the development computer is off.

## Run locally

1. Install frontend/API dependencies: `npm install`, then `npm install --prefix backend`.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` if you want the AI stylist. The MySQL API uses `backend/.env`; copy `backend/.env.example` there and fill in the local database settings.
3. Start MySQL and load `backend/database/schema.sql`, `seed.sql`, and `migrations/002_admin_dashboard.sql` in order.
4. Start the frontend and stylist API with `npm run dev`. Vite serves the site on port 5173; the MySQL API runs separately with `npm start --prefix backend` on port 8000.

## Full-stack deployment on Cloudflare

The full site is configured as one Cloudflare Worker with static assets and Express APIs. It uses a remote MySQL-compatible database (TiDB Cloud Starter is an option); a local XAMPP database cannot be reached from a public server. Customer state, uploaded product images, and private try-on photos are stored durably in that database.

1. Create a TiDB Cloud Starter cluster and a database. Import `backend/database/schema.sql`, `backend/database/seed.sql`, `backend/database/migrations/002_admin_dashboard.sql`, `backend/database/migrations/003_cloud_state.sql`, and `backend/database/migrations/004_guest_checkout.sql` in that order.
   The catalog seed sets inventory to zero on purpose. Create your admin account using `backend/scripts/create-admin.js` with your TiDB connection values in a private local `backend/.env`, then set each product's real stock in the Admin dashboard before taking orders.
2. Create a Cloudflare account and run `npx wrangler@4 login` from this repository. The Worker uses TiDB Cloud's Serverless Driver over HTTPS, which is supported in Cloudflare Workers and avoids the MySQL authentication handshake incompatibility seen with Hyperdrive.
3. Set the application secrets in Cloudflare (never commit these values):

   ```powershell
   npx wrangler secret put VYRO_SESSION_SECRET
   npx wrangler secret put TIDB_PASSWORD
   npx wrangler secret put GEMINI_API_KEY
   ```

   `GEMINI_API_KEY` is optional for the AI stylist; product browsing, accounts, and ordering use the database.
   To deploy automatically from GitHub, save `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository Actions secrets, and set the repository variable `CLOUDFLARE_DEPLOY_ENABLED=true`. Until then, deployment can be started manually with the Wrangler command below.
4. Deploy with `npm run cloudflare:deploy`. Wrangler prints the public `workers.dev` URL. The Worker serves the frontend, API, and uploaded images from one origin.

For local Worker development, copy `.dev.vars.example` to `.dev.vars`, fill in the database credentials, a session secret, and optional Gemini key, apply the migrations above, then run `npm run cloudflare:dev`. `.dev.vars` is ignored by Git.

## Project layout

- `src/` — storefront UI and API clients
- `public/assets/` — storefront images and icons
- `server.ts` — Express app for the stylist and customer APIs; production mounts `backend/server.js`
- `backend/server.js` — Express + MySQL API
- `backend/database/` — schema, seed data, and admin migration
- `worker.ts` / `wrangler.jsonc` — full-stack Cloudflare Worker and static asset configuration
- `.github/workflows/pages.yml` — GitHub Pages static preview deployment
- `render.yaml` — optional Render deployment blueprint
- `archive/` — inactive legacy site; excluded from the public repository
