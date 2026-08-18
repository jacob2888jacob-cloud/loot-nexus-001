const { getPool } = require('../_lib/db');
const { isAdminRequest } = require('../_lib/auth');

const VALID_STATUSES = ['pending', 'processing', 'completed', 'cancelled'];

module.exports = async (req, res) => {
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { id } = req.query;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    res.status(400).json({ error: 'Invalid order id' });
    return;
  }

  if (req.method === 'PATCH') {
    const status = req.body && req.body.status;
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }
    try {
      const pool = getPool();
      const result = await pool.query(
        `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2
         RETURNING id, created_at, updated_at, items, total, contact, status`,
        [status, orderId]
      );
      if (result.rowCount === 0) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      res.status(200).json({ order: result.rows[0] });
    } catch (err) {
      console.error('Failed to update order:', err);
      res.status(500).json({ error: 'Failed to update order' });
    }
    return;
  }

  res.setHeader('Allow', 'PATCH');
  res.status(405).json({ error: 'Method not allowed' });
};
