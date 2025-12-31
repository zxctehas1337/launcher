import { getPool, ensureUserSchema } from '../_lib/db.js';
import { mapUserFromDb } from '../_lib/userMapper.js';

const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  const allowedOriginPatterns = [
    /^http:\/\/localhost(?::\d+)?$/,
    /^http:\/\/127\.0\.0\.1(?::\d+)?$/,
    /^https:\/\/shakedown\.vercel\.app$/,
  ];

  const isAllowedOrigin =
    typeof origin === 'string' && allowedOriginPatterns.some((pattern) => pattern.test(origin));

  res.setHeader('Access-Control-Allow-Origin', isAllowedOrigin ? origin : '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const normalizeAvatarUpdate = (updates) => {
  if (!updates || typeof updates !== 'object') return updates;

  if (typeof updates.avatar === 'undefined') return updates;

  if (updates.avatar === null || updates.avatar === '') {
    return { ...updates, avatar: null };
  }

  if (typeof updates.avatar !== 'string') {
    throw new Error('Invalid avatar');
  }

  if (!updates.avatar.startsWith('data:image/')) {
    throw new Error('Invalid avatar');
  }

  const maxLen = 5_000_000;
  if (updates.avatar.length > maxLen) {
    throw new Error('Avatar too large');
  }

  return updates;
};

export default async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { id } = req.query;
  const pool = getPool();

  await ensureUserSchema(pool);

  if (req.method === 'GET') {
    try {
      let result;
      try {
        // Try to query with subscription_end_date
        result = await pool.query(
          `SELECT id, username, email, password, subscription, subscription_end_date, avatar, registered_at, is_admin, is_banned, email_verified, settings, hwid 
           FROM users WHERE id = $1`,
          [id]
        );
      } catch (columnError) {
        // Fallback to query without subscription_end_date if column doesn't exist
        result = await pool.query(
          `SELECT id, username, email, password, subscription, avatar, registered_at, is_admin, is_banned, email_verified, settings, hwid 
           FROM users WHERE id = $1`,
          [id]
        );
      }

      if (result.rows.length === 0) {
        return res.json({ success: false, message: 'Пользователь не найден' });
      }

      res.json({ success: true, data: mapUserFromDb(result.rows[0]) });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
  } else if (req.method === 'PATCH') {
    let updates = req.body;

    try {
      updates = normalizeAvatarUpdate(updates);
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (dbKey === 'settings') {
          fields.push(`${dbKey} = $${paramCount}`);
          values.push(JSON.stringify(updates[key]));
        } else {
          fields.push(`${dbKey} = $${paramCount}`);
          values.push(updates[key]);
        }
        paramCount++;
      });

      values.push(id);

      let result;
      try {
        // Try to update with subscription_end_date
        result = await pool.query(
          `UPDATE users SET ${fields.join(', ')} 
           WHERE id = $${paramCount} 
           RETURNING id, username, email, password, subscription, subscription_end_date, avatar, registered_at, is_admin, is_banned, settings, hwid`,
          values
        );
      } catch (columnError) {
        // Fallback to update without subscription_end_date if column doesn't exist
        const filteredFields = fields.filter(field => !field.includes('subscription_end_date'));
        const filteredValues = values.filter((_, index) => index !== values.length - 2 || !updates.subscriptionEndDate);
        
        result = await pool.query(
          `UPDATE users SET ${filteredFields.join(', ')} 
           WHERE id = $${paramCount} 
           RETURNING id, username, email, password, subscription, avatar, registered_at, is_admin, is_banned, settings, hwid`,
          filteredValues
        );
      }

      if (result.rows.length === 0) {
        return res.json({ success: false, message: 'Пользователь не найден' });
      }

      res.json({ success: true, data: mapUserFromDb(result.rows[0]) });
    } catch (error) {
      console.error('Update error:', error);
      if (error && (error.message === 'Invalid avatar' || error.message === 'Avatar too large')) {
        return res.status(400).json({ success: false, message: 'Неверный аватар' });
      }
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
};
