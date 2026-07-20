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
  ['vip-rank', 'VIP Rank', 999, 'Get a VIP role in Discord and in-server, priority queue so you skip the wait during busy hours, priority support, and access to exclusive VIP-only channels.', 0, null, null],
  ['app-priority-review', 'Application Priority Review', 999, 'Move to the front of the department application queue.', 0, 'This does not skip training, interviews, or guarantee acceptance — you still have to pass like everyone else.', null],
  ['custom-discord-role', 'Custom Discord Role', 899, 'A personalized, colored Discord role with a name and color of your choice.', 0, null, null],
  ['donation', 'Donation', null, 'Support the server directly with a donation of your choice. All proceeds go towards server costs and events.', 1, null, null],
  ['vehicle-pack', 'Exclusive Vehicle Pack', 1799, 'Unlock an exclusive civilian vehicle pack available only to supporters.', 0, null, null],
  ['name-color', 'Name Color & Tag', 699, 'Stand out with a custom name color and supporter tag visible in-game and on Discord.', 0, null, null],
  ['discord-unban-review', 'Discord + In-Game Unban Review', 999, 'Request a priority review of a Discord ban or an in-game ban.', 0, 'This guarantees a review, not a reversal.', null],
  ['server-promo', 'Server Promotion', 1000, 'Get your Discord or Roblox server promoted to our members in Discord.', 0, 'Promotion content is subject to staff approval and must follow our community guidelines.', 5000],
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
        `CREATE TABLE IF NOT EXISTS unban_applications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          order_id TEXT,
          roblox_username TEXT NOT NULL,
          discord_username TEXT NOT NULL,
          ban_type TEXT NOT NULL,
          details TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          read INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS promo_codes (
          id TEXT PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          discount_type TEXT NOT NULL,
          discount_value INTEGER NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          max_uses INTEGER,
          used_count INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS bot_settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS verify_tokens (
          token TEXT PRIMARY KEY,
          discord_id TEXT NOT NULL,
          discord_guild_id TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          expires_at TEXT NOT NULL,
          used INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS discord_verifications (
          discord_id TEXT PRIMARY KEY,
          discord_tag TEXT,
          roblox_id TEXT,
          roblox_username TEXT NOT NULL,
          verified_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS department_applications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          department TEXT NOT NULL,
          discord_username TEXT NOT NULL,
          email TEXT NOT NULL,
          age INTEGER,
          experience TEXT,
          reason TEXT NOT NULL,
          availability TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          reviewed_by TEXT,
          reviewed_at TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS staff_applications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          role TEXT NOT NULL,
          discord_username TEXT NOT NULL,
          email TEXT NOT NULL,
          age INTEGER,
          timezone TEXT,
          availability TEXT,
          prior_experience TEXT,
          why_join TEXT NOT NULL,
          strengths TEXT,
          has_microphone TEXT,
          scenario_1 TEXT NOT NULL,
          scenario_2 TEXT NOT NULL,
          scenario_3 TEXT NOT NULL,
          additional_info TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          reviewed_by TEXT,
          reviewed_at TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
      ],
      'write'
    );

    await ensureColumn(db, 'products', 'compare_at_price_cents', 'INTEGER');
    await ensureColumn(db, 'users', 'is_admin', 'INTEGER NOT NULL DEFAULT 0');
    await ensureColumn(db, 'orders', 'promo_code', 'TEXT');
    await ensureColumn(db, 'orders', 'discount_cents', 'INTEGER NOT NULL DEFAULT 0');
    await ensureColumn(db, 'orders', 'stripe_payment_intent_id', 'TEXT');
    await ensureColumn(db, 'discord_verifications', 'roblox_id', 'TEXT');
    await ensureColumn(db, 'department_applications', 'station', 'TEXT');

    // INSERT OR IGNORE: idempotent, safe even if multiple requests race to
    // seed on cold start. Existing rows are never overwritten by this — price
    // changes to already-seeded products are applied via a one-off UPDATE.
    const insertStatements = SEED_PRODUCTS.map((row) => ({
      sql: 'INSERT OR IGNORE INTO products (id, name, price_cents, description, is_donation, note, compare_at_price_cents) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: row,
    }));
    await db.batch(insertStatements, 'write');

    await ensureColumn(db, 'orders', 'stripe_session_id', 'TEXT');
    await ensureColumn(db, 'unban_applications', 'reviewed_by', 'TEXT');
    await ensureColumn(db, 'unban_applications', 'reviewed_at', 'TEXT');
  })();

  return globalForDb.__drpSchemaReady;
}

// SQLite/libSQL has no "ADD COLUMN IF NOT EXISTS", so check first — this
// runs against a database that already existed before this column was
// introduced, and re-running ALTER TABLE on an existing column errors.
async function ensureColumn(db, table, column, definition) {
  const info = await db.execute(`PRAGMA table_info(${table})`);
  const exists = info.rows.some((row) => row.name === column);
  if (!exists) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
