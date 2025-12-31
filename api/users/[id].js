import { getPool } from '../_lib/db.js';
import { mapUserFromDb } from '../_lib/userMapper.js';

export default async (req, res) => {
  const { id } = req.query;
  const pool = getPool();

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT id, username, email, password, subscription, avatar, registered_at, is_admin, is_banned, email_verified, settings, hwid 
         FROM users WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.json({ success: false, message: 'Пользователь не найден' });
      }

      res.json({ success: true, data: mapUserFromDb(result.rows[0]) });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
  } else if (req.method === 'PATCH') {
    const updates = req.body;

    try {
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

      const result = await pool.query(
        `UPDATE users SET ${fields.join(', ')} 
         WHERE id = $${paramCount} 
         RETURNING id, username, email, password, subscription, avatar, registered_at, is_admin, is_banned, settings, hwid`,
        values
      );

      if (result.rows.length === 0) {
        return res.json({ success: false, message: 'Пользователь не найден' });
      }

      res.json({ success: true, data: mapUserFromDb(result.rows[0]) });
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
};
