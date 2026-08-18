const { getPool } = require('./_lib/db');
const { isAdminRequest } = require('./_lib/auth');

const MAX_ITEMS = 50;
const MAX_NAME_LEN = 200;
const MAX_CONTACT_LEN = 200;

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) return null;
  const clean = [];
  for (const item of items) {
    if (!item || typeof item.name !== 'string' || typeof item.price !== 'number') return null;
    if (!Number.isFinite(item.price) || item.price < 0 || item.price > 100000) return null;
    const name = item.name.trim().slice(0, MAX_NAME_LEN);
    if (!name) return null;
    clean.push({ name, price: Math.round(item.price * 100) / 100 });
  }
  return clean;
}

module.exports = async (req, res) => {
  const pool = getPool();

  if (req.method === 'POST') {
    // Public: a customer confirming they've placed/paid for an order on checkout.
    const body = req.body || {};
    const items = validateItems(body.items);
    if (!items) {
      res.status(400).json({ error: 'Invalid or missing items' });
      return;
    }
    const total = Math.round(items.reduce((sum, i) => sum + i.price, 0) * 100) / 100;
    const contact =
      typeof body.contact === 'string' ? body.contact.trim().slice(0, MAX_CONTACT_LEN) : null;

    try {
      const result = await pool.query(
        `INSERT INTO orders (items, total, contact, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING id, created_at`,
        [JSON.stringify(items), total, contact || null]
      );
      res.status(201).json({ id: result.rows[0].id, created_at: result.rows[0].created_at });
    } catch (err) {
      console.error('Failed to create order:', err);
      res.status(500).json({ error: 'Failed to save order' });
    }
    return;
  }

  if (req.method === 'GET') {
    // Admin-only: list all orders.
    if (!isAdminRequest(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const result = await pool.query(
        `SELECT id, created_at, updated_at, items, total, contact, status
         FROM orders
         ORDER BY created_at DESC
         LIMIT 500`
      );
      res.status(200).json({ orders: result.rows });
    } catch (err) {
      console.error('Failed to list orders:', err);
      res.status(500).json({ error: 'Failed to load orders' });
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method not allowed' });
};
