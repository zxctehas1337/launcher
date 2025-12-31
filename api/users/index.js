import { getPool } from '../_lib/db.js';
import { mapUserFromDb } from '../_lib/userMapper.js';

export default async (req, res) => {
  const pool = getPool();
  const { id } = req.query;

  if (id) {
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

        return res.json({ success: true, data: mapUserFromDb(result.rows[0]) });
      } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ success: false, message: 'Ошибка сервера' });
      }
    }

    if (req.method === 'PATCH') {
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
           RETURNING id, username, email, password, subscription, avatar, registered_at, is_admin, is_banned, email_verified, settings, hwid`,
          values
        );

        if (result.rows.length === 0) {
          return res.json({ success: false, message: 'Пользователь не найден' });
        }

        return res.json({ success: true, data: mapUserFromDb(result.rows[0]) });
      } catch (error) {
        console.error('Update error:', error);
        return res.status(500).json({ success: false, message: 'Ошибка сервера' });
      }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, email, subscription, registered_at, is_admin, is_banned, email_verified, settings, hwid 
       FROM users ORDER BY id DESC`
    );

    const users = result.rows.map(dbUser => ({
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      subscription: dbUser.subscription,
      registeredAt: dbUser.registered_at,
      isAdmin: dbUser.is_admin,
      isBanned: dbUser.is_banned,
      emailVerified: dbUser.email_verified,
      settings: dbUser.settings,
      hwid: dbUser.hwid
    }));

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};
