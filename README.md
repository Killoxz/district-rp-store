# District RP Store

Next.js store site with Roblox login, a real cart, and checkout that produces an order + manual payment instructions.

## Running it locally

```
npm install
npm run dev
```

Then open http://localhost:3000. A `data.db` file is created automatically on first run with the 12 store products seeded in.

## Getting real "Log in with Roblox" working

Right now `.env.local` has placeholder Roblox credentials, so clicking "Log in with Roblox" will redirect to Roblox's real login page but fail after that (invalid client). To make login actually work:

1. Go to **https://create.roblox.com/credentials** (log in with your Roblox account).
2. Click **Create OAuth 2.0 App** (or similar — Roblox's UI names this "OAuth Apps").
3. Fill in:
   - **Name**: District RP Store (or whatever you want users to see)
   - **Redirect URIs**: add exactly `http://localhost:3000/api/auth/callback/roblox` for local testing. When you deploy the site to a real domain, add another redirect URI there too, e.g. `https://yourdomain.com/api/auth/callback/roblox`.
   - **Scopes**: enable `openid` and `profile`.
4. Save, then copy the **Client ID** and **Client Secret** it gives you.
5. Open `.env.local` in this project and replace the placeholders:
   ```
   ROBLOX_CLIENT_ID=<paste your client id>
   ROBLOX_CLIENT_SECRET=<paste your client secret>
   ```
6. Also set a real `NEXTAUTH_SECRET` (any long random string works):
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   Paste the output as `NEXTAUTH_SECRET` in `.env.local`.
7. Restart `npm run dev`. Logging in with Roblox should now work end-to-end — it creates a row in the `users` table keyed by your Roblox ID, with your Roblox username and avatar.

**Never commit `.env.local`** — it's already in `.gitignore`. Only `.env.local.example` (with blank values) should be committed.

## Getting real live player count / online status working

The home banner shows a live "Online"/"Server Offline" indicator and real player count, pulled from ERLC's official Server API — not Roblox's public API, since District RP is a private server inside the shared ERLC game rather than its own Roblox game. Until you add a real key, it shows "Live stats not set up yet".

1. Join your District RP private server in ERLC as the owner or a co-owner.
2. Open the in-game Server Settings menu, find the **Server API** tab, and generate/copy the **Server Key**. Full docs: https://apidocs.policeroleplay.community/
3. Open `.env.local` and set:
   ```
   ERLC_SERVER_KEY=<paste your server key>
   ```
4. Restart `npm run dev`. The banner will start polling `/api/server-status` every 20 seconds and show real numbers.

This key is a secret like the others — never commit `.env.local`, only `.env.local.example`.

## Deploying for free (no domain needed)

This site is set up to deploy on **Vercel's free tier**, which gives you a real public URL like `district-rp.vercel.app` — no domain purchase required. Vercel runs Next.js as serverless functions, which have no persistent disk, so the database has to live somewhere external: **Turso** (a free hosted SQLite-compatible database) fills that role. Locally, nothing changes — it still just uses a local `data.db` file automatically.

### 1. Create a free Turso database

1. Install the Turso CLI and sign up (free, see https://docs.turso.tech/quickstart for the current install command for your OS).
2. Create a database:
   ```
   turso db create district-rp
   ```
3. Get its connection URL:
   ```
   turso db show district-rp --url
   ```
4. Create an auth token for it:
   ```
   turso db tokens create district-rp
   ```
5. You now have two values: a `libsql://...` URL and a long token string. You'll paste these into Vercel's environment variables in step 3 below (not into your local `.env.local` — leave that blank so local dev keeps using the simple local file).

### 2. Push this project to GitHub

Vercel deploys straight from a GitHub repo. If this project isn't already a git repo:
```
git init
git add .
git commit -m "Initial commit"
```
Then create a new repo on GitHub and push to it (GitHub's "create a new repository" page shows the exact push commands for an existing local project).

### 3. Deploy on Vercel

1. Go to https://vercel.com, sign up free (GitHub login is easiest), and click **Add New Project**.
2. Import the GitHub repo you just pushed. Vercel auto-detects Next.js — no build config needed.
3. Before deploying, add these **Environment Variables** in the Vercel project settings (same names as `.env.local.example`):
   - `ROBLOX_CLIENT_ID`, `ROBLOX_CLIENT_SECRET` — same values as local, or a separate OAuth app if you want to keep prod/dev fully separate
   - `NEXTAUTH_SECRET` — generate a fresh one for production
   - `NEXTAUTH_URL` — your Vercel URL once you know it, e.g. `https://district-rp.vercel.app` (you can update this after the first deploy shows you the URL)
   - `PAYPAL_LINK`, `DISCORD_SUPPORT_LINK` — your real links
   - `ERLC_SERVER_KEY` — your real ERLC server key
   - `TURSO_DATABASE_URL` — the `libsql://...` URL from step 1
   - `TURSO_AUTH_TOKEN` — the token from step 1
4. Click **Deploy**. Once it's live, copy the real `https://your-project.vercel.app` URL.
5. Update `NEXTAUTH_URL` in Vercel's env vars to that exact URL if you didn't already, and redeploy (Vercel redeploys automatically on env var changes or you can trigger it manually).

### 4. Add the production redirect URI to Roblox

Go back to **https://create.roblox.com/credentials**, open your OAuth app, and add a second redirect URI alongside the localhost one:
```
https://your-project.vercel.app/api/auth/callback/roblox
```
Roblox login won't work on the deployed site until this exact URL is added there.

That's it — from then on, every `git push` to your repo auto-deploys a new version, and the site stays free (Vercel's free tier and Turso's free tier are both generous for a small store site like this).

## How checkout works right now

There's no real payment processor wired in — checkout builds an order (itemized, with a total) and shows a payment-instructions page with:
- A "Pay with PayPal" button, driven by `PAYPAL_LINK` in `.env.local`
- A "Open Discord Ticket" button, driven by `DISCORD_SUPPORT_LINK` in `.env.local`

Edit those two env vars to your real links. The customer pays manually, then opens a Discord ticket with their order ID so staff can deliver the item. If you'd rather have real card checkout later (e.g. Stripe), that's a separate build — this version deliberately keeps payment manual since that's what was asked for.

## Editing store products

Products live in `SEED_PRODUCTS` in [lib/db.js](lib/db.js). Seeding uses `INSERT OR IGNORE`, so existing rows are never overwritten — if you edit a product's price or description after it's already in the database, delete the local `data.db` file (or the corresponding row in your Turso database) and restart to reseed.

## Project structure

- `app/` — pages (Next.js App Router): home, store, cart, checkout/order confirmation, login, rules, support, policies
- `app/actions/cart.js` — server actions for add/update/remove cart items and checkout
- `app/api/auth/[...nextauth]/route.js` — NextAuth route wired to Roblox's OAuth/OIDC endpoints
- `lib/db.js` — database schema + product seed, via `@libsql/client` (local file in dev, hosted Turso database in production)
- `lib/store.js` — all cart/order/user database queries
- `lib/auth.js` — NextAuth config + Roblox provider
- `lib/erlc.js` — fetches + caches live server status from ERLC's Server API
- `app/api/server-status/route.js` — endpoint the banner polls for live status
- `components/` — Header, Footer, theme toggle, login/user menu, mobile nav, live ServerStatus indicator
- `legacy-static/` — the original static HTML/CSS/JS version, kept for reference, no longer used

## Notes

- Cart and checkout require being logged in with Roblox — adding to cart while logged out redirects to `/login`.
- Light/dark mode toggle persists via `localStorage` and still works exactly as before.
- Locally, the database is a plain `data.db` file (via `@libsql/client`'s local file mode) — no server or account needed for local dev. Only the deployed site needs a real Turso database.
