<div align="center">

# VYRO Fashion

### Modern streetwear. A smoother way to shop.

Browse the collection, choose your size, and place an order online.

<a href="https://vyro-fashion.hoursimo69.workers.dev"><strong>Visit the live store →</strong></a>

</div>

---

## About

VYRO is a full-stack fashion storefront built for a fast, polished shopping experience. The live store serves its catalog and APIs from Cloudflare Workers, with TiDB Cloud providing persistent product, customer, and order data.

## Store features

- Product catalog with category browsing, search, colors, and size selection
- Cart and cash-on-delivery checkout
- Per-size stock availability, including clear sold-out states
- Customer accounts, order tracking, saved products, and promotions
- AI fashion stylist and virtual try-on features
- Responsive storefront for desktop and mobile

## Technology

| Area | Tools |
| --- | --- |
| Storefront | React, Vite, TypeScript, Tailwind CSS |
| API | Node.js, Express |
| Database | TiDB Cloud, MySQL-compatible |
| Hosting | Cloudflare Workers and Workers Assets |
| AI features | Google Gemini API (optional) |

## Run locally

### Requirements

- Node.js 22 or later
- MySQL or MariaDB for the local API

### Setup

```powershell
git clone https://github.com/mohamedhour/VYRO.git
cd VYRO
npm install
npm install --prefix backend
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

Add your local API and database values to the private `.env` files. The example files contain placeholders only. Never commit real passwords or API keys.

Create a local database, then run these SQL files in order:

1. `backend/database/schema.sql`
2. `backend/database/seed.sql`
3. `backend/database/migrations/002_admin_dashboard.sql`
4. `backend/database/migrations/003_cloud_state.sql`
5. `backend/database/migrations/004_guest_checkout.sql`

The initial catalog has zero stock. Set the real quantities by size before accepting orders. The optional `20261121_stock_by_size.sql` migration is for an existing database that does not yet have the per-size stock column; its sample quantities should be replaced with actual inventory.

### Start the app

Open two PowerShell terminals from the project folder:

```powershell
npm start --prefix backend
```

```powershell
npm run dev
```

Vite serves the storefront at `http://localhost:5173`; the local product API uses port `8000`.

## Deploy to Cloudflare

The live store is one Worker that serves the storefront and API. It connects to a remote TiDB Cloud database; a local XAMPP database cannot be reached by the public Worker.

1. Configure the TiDB cluster and apply the database schema and migrations.
2. Log in to Cloudflare from the project folder:

   ```powershell
   npx wrangler@4 login
   ```

3. Add the required secrets. Wrangler prompts for each value; keep secret values private:

   ```powershell
   npx wrangler@4 secret put VYRO_SESSION_SECRET
   npx wrangler@4 secret put TIDB_PASSWORD
   ```

   `GEMINI_API_KEY` is optional and only needed for Gemini-powered features.

4. Build and deploy:

   ```powershell
   npm run cloudflare:deploy
   ```

To deploy automatically from GitHub Actions, configure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets, then set the `CLOUDFLARE_DEPLOY_ENABLED` repository variable to `true`.

## Project structure

```text
src/                 Storefront UI and API clients
backend/             Node.js product, account, and order API
backend/database/    Database schema, seed data, and migrations
server.ts            Customer, stylist, promotion, and try-on API
worker.ts            Cloudflare Worker entry point
wrangler.jsonc       Cloudflare Worker and asset configuration
```

## Security

Keep `.env`, `backend/.env`, `.dev.vars`, database passwords, session secrets, and API keys out of Git. Use Cloudflare secrets for production credentials.
