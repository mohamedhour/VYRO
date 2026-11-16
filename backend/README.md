# VYRO backend (Node.js)

Express and MySQL/MariaDB API for the VYRO frontend. `server.js` is the runtime entry point. Existing API URLs, including their `.php` suffixes, are retained so the current frontend can keep using them while the backend runs on Node.js.

## Requirements and setup

- Node.js 20.6 or newer
- MySQL/MariaDB with the VYRO schema and admin migration applied

1. Create the database and import `database/schema.sql`, `database/seed.sql`, then `database/migrations/002_admin_dashboard.sql` (in that order).
2. Copy `.env.example` to `.env` and set database credentials plus a unique `VYRO_SESSION_SECRET` of at least 32 characters. The server reads environment variables; Node does not load `.env` automatically, so start it with `node --env-file=.env server.js` or export the values in your process manager.
3. Install dependencies with `npm install`.
4. Create an administrator: `node --env-file=.env scripts/create-admin.js "Your Name" admin@vyro.ma "a-strong-password"`.
5. Start the API with `npm start`. By default it listens on `http://localhost:8000`.
6. Set the frontend's `VITE_API_BASE_URL` to the API origin and set `VYRO_ALLOWED_ORIGINS` to the frontend origin. Production deployments should use HTTPS and set `VYRO_IS_HTTPS=true`.

## API and security

Responses use `{ "success": true, "data": ... }` or `{ "success": false, "error": ... }`. Mutating requests require a CSRF token: first call `GET /api/auth/csrf.php` with credentials, then send its `data.csrfToken` as `X-CSRF-Token`. Browser requests must include credentials. The server uses signed, HttpOnly, SameSite=Lax cookies, validates allowed origins, checks admin access against the database, and never accepts client-supplied prices when creating orders.

The Node API covers authentication, catalog, orders, wishlist, saved looks, try-on statistics, and admin operations. Product images are served from `public/uploads/products`; private try-on photos are stored in `private/tryon-photos` and delivered only after checking ownership.

`bcryptjs` verifies existing PHP bcrypt password hashes so accounts can migrate without resetting passwords. Existing PHP source files are no longer used by the Node server; use `npm start` as the backend runtime.

## Configuration

See `.env.example` for supported environment variables. Do not commit real credentials or the session secret. Keep `VYRO_DEBUG=false` outside local development.
