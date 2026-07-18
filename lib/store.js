import crypto from 'crypto';
import { getDb, ensureSchema } from './db.js';

async function db() {
  await ensureSchema();
  return getDb();
}

export async function upsertUserFromRoblox({ robloxId, username, avatarUrl }) {
  const client = await db();
  const existing = await client.execute({
    sql: 'SELECT id FROM users WHERE roblox_id = ?',
    args: [robloxId],
  });

  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await client.execute({
      sql: 'UPDATE users SET username = ?, avatar_url = ? WHERE id = ?',
      args: [username, avatarUrl || null, id],
    });
    return id;
  }

  const id = `user_${crypto.randomUUID()}`;
  await client.execute({
    sql: 'INSERT INTO users (id, roblox_id, username, avatar_url) VALUES (?, ?, ?, ?)',
    args: [id, robloxId, username, avatarUrl || null],
  });
  return id;
}

export async function getUserById(userId) {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [userId],
  });
  return result.rows[0] || null;
}

export async function getProducts() {
  const client = await db();
  const result = await client.execute('SELECT * FROM products');
  return result.rows;
}

export async function getProduct(productId) {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT * FROM products WHERE id = ?',
    args: [productId],
  });
  return result.rows[0] || null;
}

export async function getCartItems(userId) {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT ci.id, ci.quantity, ci.custom_price_cents, p.id AS product_id, p.name, p.price_cents, p.is_donation, p.compare_at_price_cents
          FROM cart_items ci
          JOIN products p ON p.id = ci.product_id
          WHERE ci.user_id = ?
          ORDER BY ci.created_at ASC`,
    args: [userId],
  });

  return result.rows.map((row) => {
    const unitPriceCents = row.is_donation ? row.custom_price_cents || 0 : row.price_cents;
    return {
      id: row.id,
      productId: row.product_id,
      name: row.name,
      isDonation: !!row.is_donation,
      isDiscounted: !!(row.compare_at_price_cents && row.compare_at_price_cents > row.price_cents),
      quantity: row.quantity,
      unitPriceCents,
      lineTotalCents: unitPriceCents * row.quantity,
    };
  });
}

export async function getCartCount(userId) {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT COALESCE(SUM(quantity), 0) AS total FROM cart_items WHERE user_id = ?',
    args: [userId],
  });
  return result.rows[0].total;
}

export async function addToCart(userId, productId, { quantity = 1, customPriceCents } = {}) {
  const client = await db();
  const product = await getProduct(productId);
  if (!product) throw new Error('Unknown product');

  if (product.is_donation) {
    const amount = Math.max(1, Math.round(Number(customPriceCents) || 0));
    await client.execute({
      sql: 'INSERT INTO cart_items (user_id, product_id, quantity, custom_price_cents) VALUES (?, ?, 1, ?)',
      args: [userId, productId, amount],
    });
    return;
  }

  const existing = await client.execute({
    sql: 'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
    args: [userId, productId],
  });

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    await client.execute({
      sql: 'UPDATE cart_items SET quantity = ? WHERE id = ?',
      args: [row.quantity + quantity, row.id],
    });
  } else {
    await client.execute({
      sql: 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
      args: [userId, productId, quantity],
    });
  }
}

export async function updateCartItemQuantity(userId, cartItemId, quantity) {
  const client = await db();
  if (quantity <= 0) {
    await client.execute({
      sql: 'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      args: [cartItemId, userId],
    });
    return;
  }
  await client.execute({
    sql: 'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
    args: [quantity, cartItemId, userId],
  });
}

export async function removeCartItem(userId, cartItemId) {
  const client = await db();
  await client.execute({
    sql: 'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
    args: [cartItemId, userId],
  });
}

export async function clearCart(userId) {
  const client = await db();
  await client.execute({
    sql: 'DELETE FROM cart_items WHERE user_id = ?',
    args: [userId],
  });
}

async function createOrder(userId, items, { promoCode, clearCart } = {}) {
  const client = await db();
  if (items.length === 0) throw new Error('No items to order');

  const rawTotal = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  // Items already marked down (e.g. the Whitelist Slot's compare-at price)
  // don't stack with promo codes — only the non-discounted portion of the
  // order counts toward what a promo code can discount.
  const promoEligibleTotal = items.reduce((sum, item) => sum + (item.isDiscounted ? 0 : item.lineTotalCents), 0);

  let promo = null;
  let discountCents = 0;
  if (promoCode) {
    promo = await findUsablePromoCode(promoCode);
    if (!promo) throw new Error('INVALID_PROMO');
    if (promoEligibleTotal <= 0) throw new Error('PROMO_NOT_APPLICABLE');
    discountCents = calculateDiscount(promoEligibleTotal, promo);
  }

  const totalCents = Math.max(0, rawTotal - discountCents);
  const orderId = `order_${crypto.randomUUID().slice(0, 8)}`;

  const tx = await client.transaction('write');
  try {
    await tx.execute({
      sql: 'INSERT INTO orders (id, user_id, status, total_cents, promo_code, discount_cents) VALUES (?, ?, ?, ?, ?, ?)',
      args: [orderId, userId, 'pending_payment', totalCents, promo ? promo.code : null, discountCents],
    });

    for (const item of items) {
      await tx.execute({
        sql: 'INSERT INTO order_items (order_id, product_id, name, unit_price_cents, quantity) VALUES (?, ?, ?, ?, ?)',
        args: [orderId, item.productId, item.name, item.unitPriceCents, item.quantity],
      });
    }

    if (clearCart) {
      await tx.execute({ sql: 'DELETE FROM cart_items WHERE user_id = ?', args: [userId] });
    }

    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }

  if (promo) {
    await incrementPromoCodeUsage(promo.id);
  }

  return orderId;
}

export async function createOrderFromCart(userId, promoCode) {
  const items = await getCartItems(userId);
  if (items.length === 0) throw new Error('Cart is empty');
  return createOrder(userId, items, { promoCode, clearCart: true });
}

// "Buy Now" — a single item ordered directly without ever touching the cart.
export async function createOrderForSingleItem(userId, productId, { quantity = 1, customPriceCents, promoCode } = {}) {
  const product = await getProduct(productId);
  if (!product) throw new Error('Unknown product');

  const unitPriceCents = product.is_donation
    ? Math.max(1, Math.round(Number(customPriceCents) || 0))
    : product.price_cents;

  const item = {
    productId: product.id,
    name: product.name,
    unitPriceCents,
    isDiscounted: !!(product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents),
    quantity,
    lineTotalCents: unitPriceCents * quantity,
  };

  return createOrder(userId, [item], { promoCode, clearCart: false });
}

export async function findMostRecentOrderForProduct(userId, productId) {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT o.id
          FROM orders o
          JOIN order_items oi ON oi.order_id = o.id
          WHERE o.user_id = ? AND oi.product_id = ?
          ORDER BY o.created_at DESC
          LIMIT 1`,
    args: [userId, productId],
  });
  return result.rows[0]?.id || null;
}

export async function hasPurchasedProduct(userId, productId) {
  const orderId = await findMostRecentOrderForProduct(userId, productId);
  return !!orderId;
}

// Confirms a specific order both belongs to this user AND actually contains
// this product — used to stop someone from submitting a form just because
// they're logged into an account that has bought *something*, or from
// sharing a link/order id that isn't really theirs.
export async function verifyOrderContainsProduct(userId, orderId, productId) {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT 1
          FROM orders o
          JOIN order_items oi ON oi.order_id = o.id
          WHERE o.id = ? AND o.user_id = ? AND oi.product_id = ?
          LIMIT 1`,
    args: [orderId, userId, productId],
  });
  return result.rows.length > 0;
}

export async function createUnbanApplication({
  userId,
  orderId,
  robloxUsername,
  discordUsername,
  banType,
  details,
}) {
  const client = await db();
  const id = `unban_${crypto.randomUUID().slice(0, 8)}`;

  await client.execute({
    sql: `INSERT INTO unban_applications
          (id, user_id, order_id, roblox_username, discord_username, ban_type, details)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, userId, orderId || null, robloxUsername, discordUsername, banType, details],
  });

  return id;
}

export async function getUnbanApplicationsForUser(userId) {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT * FROM unban_applications WHERE user_id = ? ORDER BY created_at DESC',
    args: [userId],
  });
  return result.rows;
}

export async function getOrder(orderId, userId) {
  const client = await db();
  const orderResult = await client.execute({
    sql: 'SELECT * FROM orders WHERE id = ? AND user_id = ?',
    args: [orderId, userId],
  });
  const order = orderResult.rows[0];
  if (!order) return null;

  const itemsResult = await client.execute({
    sql: 'SELECT * FROM order_items WHERE order_id = ?',
    args: [orderId],
  });

  return { ...order, items: itemsResult.rows };
}

// No user check — only for server-to-server use (the Stripe webhook has no
// logged-in session to check against).
export async function getOrderById(orderId) {
  const client = await db();
  const orderResult = await client.execute({
    sql: `SELECT o.*, u.username AS buyer_username
          FROM orders o
          JOIN users u ON u.id = o.user_id
          WHERE o.id = ?`,
    args: [orderId],
  });
  const order = orderResult.rows[0];
  if (!order) return null;

  const itemsResult = await client.execute({
    sql: 'SELECT * FROM order_items WHERE order_id = ?',
    args: [orderId],
  });

  return { ...order, items: itemsResult.rows };
}

export async function setOrderPaymentIntent(orderId, paymentIntentId) {
  const client = await db();
  await client.execute({
    sql: 'UPDATE orders SET stripe_payment_intent_id = ? WHERE id = ?',
    args: [paymentIntentId, orderId],
  });
}

export async function setOrderStripeSession(orderId, stripeSessionId) {
  const client = await db();
  await client.execute({
    sql: 'UPDATE orders SET stripe_session_id = ? WHERE id = ?',
    args: [stripeSessionId, orderId],
  });
}

export async function markOrderPaid(orderId) {
  const client = await db();
  await client.execute({
    sql: "UPDATE orders SET status = 'paid' WHERE id = ?",
    args: [orderId],
  });
}

export async function getUnreadNotificationCount(userId) {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read = 0',
    args: [userId],
  });
  return result.rows[0]?.count || 0;
}

export async function getNotificationsForUser(userId) {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    args: [userId],
  });
  return result.rows;
}

// Fetches unread notifications and marks them read in one step — used to
// drive the one-shot popup toast, so the same notification never pops twice.
export async function consumeUnreadNotifications(userId) {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT * FROM notifications WHERE user_id = ? AND read = 0 ORDER BY created_at ASC',
    args: [userId],
  });
  if (result.rows.length > 0) {
    await client.execute({
      sql: 'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0',
      args: [userId],
    });
  }
  return result.rows;
}

export async function isAdmin(userId) {
  const client = await db();
  const result = await client.execute({ sql: 'SELECT is_admin FROM users WHERE id = ?', args: [userId] });
  return !!result.rows[0]?.is_admin;
}

export async function getAllPromoCodes() {
  const client = await db();
  const result = await client.execute('SELECT * FROM promo_codes ORDER BY created_at DESC');
  return result.rows;
}

export async function createPromoCode({ code, discountType, discountValue, maxUses }) {
  const client = await db();
  const id = `promo_${crypto.randomUUID().slice(0, 8)}`;
  await client.execute({
    sql: 'INSERT INTO promo_codes (id, code, discount_type, discount_value, max_uses) VALUES (?, ?, ?, ?, ?)',
    args: [id, code.trim().toUpperCase(), discountType, discountValue, maxUses || null],
  });
  return id;
}

export async function togglePromoCodeActive(id) {
  const client = await db();
  await client.execute({ sql: 'UPDATE promo_codes SET active = 1 - active WHERE id = ?', args: [id] });
}

export async function deletePromoCode(id) {
  const client = await db();
  await client.execute({ sql: 'DELETE FROM promo_codes WHERE id = ?', args: [id] });
}

// Returns the promo code row if it's usable right now (exists, active, under
// its usage cap), or null otherwise — callers decide how to surface "invalid".
export async function findUsablePromoCode(code) {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT * FROM promo_codes WHERE code = ? AND active = 1',
    args: [code.trim().toUpperCase()],
  });
  const promo = result.rows[0];
  if (!promo) return null;
  if (promo.max_uses != null && promo.used_count >= promo.max_uses) return null;
  return promo;
}

export async function incrementPromoCodeUsage(id) {
  const client = await db();
  await client.execute({ sql: 'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?', args: [id] });
}

// Fixed discounts are in cents; percent discounts are a whole number 1-100.
// Never lets the total go below zero (e.g. a $5-off code on a $3 item).
export function calculateDiscount(totalCents, promo) {
  if (!promo) return 0;
  const raw = promo.discount_type === 'percent' ? Math.round((totalCents * promo.discount_value) / 100) : promo.discount_value;
  return Math.min(raw, totalCents);
}

// Small key-value store for bot-related state (e.g. which Discord message to
// edit) that doesn't warrant its own table.
export async function getBotSetting(key) {
  const client = await db();
  const result = await client.execute({ sql: 'SELECT value FROM bot_settings WHERE key = ?', args: [key] });
  return result.rows[0]?.value ?? null;
}

export async function setBotSetting(key, value) {
  const client = await db();
  await client.execute({
    sql: 'INSERT INTO bot_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    args: [key, value],
  });
}

// Written by the bot when someone clicks "Verify" in Discord; read here once
// they've logged in with Roblox to complete the link between the two
// accounts. Single-use and short-lived (see the bot's createVerifyToken).
export async function getVerifyToken(token) {
  const client = await db();
  const result = await client.execute({ sql: 'SELECT * FROM verify_tokens WHERE token = ?', args: [token] });
  return result.rows[0] || null;
}

export async function markVerifyTokenUsed(token) {
  const client = await db();
  await client.execute({ sql: 'UPDATE verify_tokens SET used = 1 WHERE token = ?', args: [token] });
}

export async function recordDiscordVerification(discordId, discordTag, robloxId, robloxUsername) {
  const client = await db();
  await client.execute({
    sql: `INSERT INTO discord_verifications (discord_id, discord_tag, roblox_id, roblox_username, verified_at)
          VALUES (?, ?, ?, ?, datetime('now'))
          ON CONFLICT(discord_id) DO UPDATE SET
            discord_tag = excluded.discord_tag,
            roblox_id = excluded.roblox_id,
            roblox_username = excluded.roblox_username,
            verified_at = excluded.verified_at`,
    args: [discordId, discordTag, robloxId, robloxUsername],
  });
}

export async function createDepartmentApplication({
  userId,
  department,
  discordUsername,
  email,
  age,
  experience,
  reason,
  availability,
}) {
  const client = await db();
  const id = `deptapp_${crypto.randomUUID().slice(0, 8)}`;

  await client.execute({
    sql: `INSERT INTO department_applications
          (id, user_id, department, discord_username, email, age, experience, reason, availability)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, userId, department, discordUsername, email, age || null, experience || null, reason, availability || null],
  });

  return id;
}

export async function getDepartmentApplication(id) {
  const client = await db();
  const result = await client.execute({ sql: 'SELECT * FROM department_applications WHERE id = ?', args: [id] });
  return result.rows[0] || null;
}

export async function updateDepartmentApplicationStatus(id, status, reviewedBy) {
  const client = await db();
  await client.execute({
    sql: "UPDATE department_applications SET status = ?, reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?",
    args: [status, reviewedBy, id],
  });
}
