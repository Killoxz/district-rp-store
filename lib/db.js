import { createClient } from '@libsql/client';

// Local dev: a plain file on disk, no server needed (great for `npm run dev`).
// Production (e.g. Vercel): serverless functions have no persistent disk, so
// TURSO_DATABASE_URL/TURSO_AUTH_TOKEN must point at a real hosted Turso
// database instead — see README.md for how to create one.
const globalForDb = globalThis;

export function getDb() {
  if (globalForDb.__drpDb) return globalForDb.__drpDb;

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:./data.db',
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });

  globalForDb.__drpDb = client;
  return client;
}

const SEED_PRODUCTS = [
  ['vip-rank', 'VIP Rank', 499, 'Get a VIP role in Discord and in-server, priority support, and access to exclusive VIP-only channels.', 0, null],
  ['priority-queue', 'Priority Queue', 350, 'Skip the server join queue during busy hours and get into District RP faster.', 0, null],
  ['custom-livery', 'Custom Vehicle Livery', 799, 'Get a fully custom livery designed for your civilian or department vehicle of choice.', 0, null],
  ['app-priority-review', 'Application Priority Review', 500, 'Move to the front of the department application queue.', 0, 'This does not skip training, interviews, or guarantee acceptance — you still have to pass like everyone else.'],
  ['custom-discord-role', 'Custom Discord Role', 500, 'A personalized, colored Discord role with a name and color of your choice.', 0, null],
  ['custom-plate', 'Custom License Plate', 250, 'Set a custom license plate on your in-game vehicles (subject to server naming rules).', 0, null],
  ['donation', 'Donation', null, 'Support the server directly with a donation of your choice. All proceeds go towards server costs and events.', 1, null],
  ['vehicle-pack', 'Exclusive Vehicle Pack', 1299, 'Unlock an exclusive civilian vehicle pack available only to supporters.', 0, null],
  ['ride-along', 'Ride-Along Pass', 400, 'Book a ride-along with an active PD, SD, FD, or EMS unit for a scheduled shift.', 0, null],
  ['whitelist-slot', 'Server Whitelist Slot', 1000, 'Reserve a guaranteed whitelisted slot on District RP, even during full server events.', 0, null],
  ['name-color', 'Name Color & Tag', 300, 'Stand out with a custom name color and supporter tag visible in-game and on Discord.', 0, null],
  ['discord-unban-review', 'Discord Unban Review', 500, 'Request a priority review of a Discord ban.', 0, 'This guarantees a review, not a reversal.'],
];

// Turso/libSQL is queried over HTTP even in local file mode, so schema
// creation is async — this promise is cached on globalThis the same way the
// client itself is, so concurrent requests during startup all await the same
// in-flight setup instead of racing each other.
export async function ensureSchema() {
  if (globalForDb.__drpSchemaReady) return globalForDb.__drpSchemaReady;

  globalForDb.__drpSchemaReady = (async () => {
    const db = getDb();

    await db.batch(
      [
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          roblox_id TEXT UNIQUE NOT NULL,
          username TEXT NOT NULL,
          avatar_url TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price_cents INTEGER,
          description TEXT NOT NULL,
          is_donation INTEGER NOT NULL DEFAULT 0,
          note TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS cart_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id TEXT NOT NULL REFERENCES products(id),
          quantity INTEGER NOT NULL DEFAULT 1,
          custom_price_cents INTEGER,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          status TEXT NOT NULL DEFAULT 'pending_payment',
          total_cents INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id TEXT,
          name TEXT NOT NULL,
          unit_price_cents INTEGER NOT NULL,
          quantity INTEGER NOT NULL
        )`,
      ],
      'write'
    );

    // INSERT OR IGNORE: idempotent, safe even if multiple requests race to
    // seed on cold start.
    const insertStatements = SEED_PRODUCTS.map((row) => ({
      sql: 'INSERT OR IGNORE INTO products (id, name, price_cents, description, is_donation, note) VALUES (?, ?, ?, ?, ?, ?)',
      args: row,
    }));
    await db.batch(insertStatements, 'write');
  })();

  return globalForDb.__drpSchemaReady;
}
