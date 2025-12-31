import { getPool } from '../_lib/db.js';

export default async function handler(req, res) {
  const pool = getPool();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { key, userId } = req.body;

  if (!key || !userId) {
    res.status(400).json({ success: false, message: 'Ключ и ID пользователя обязательны' });
    return;
  }

  try {
    const keyResult = await pool.query('SELECT * FROM license_keys WHERE UPPER(key) = $1', [key.trim().toUpperCase()]);

    if (keyResult.rows.length === 0) {
      res.json({ success: false, message: 'Ключ не найден' });
      return;
    }

    const licenseKey = keyResult.rows[0];

    if (licenseKey.is_used) {
      res.json({ success: false, message: 'Ключ уже использован' });
      return;
    }

    await pool.query(
      `UPDATE license_keys 
       SET is_used = true, used_by = $1, used_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [userId, licenseKey.id]
    );

    let newSubscription = 'free';
    if (licenseKey.product === 'premium' || licenseKey.product === 'inside-client') {
      newSubscription = 'premium';
    } else if (licenseKey.product === 'alpha') {
      newSubscription = 'alpha';
    }

    await pool.query('UPDATE users SET subscription = $1 WHERE id = $2', [newSubscription, userId]);

    res.json({
      success: true,
      message: 'Ключ активирован',
      data: {
        product: licenseKey.product,
        duration: licenseKey.duration_days,
        newSubscription
      }
    });
  } catch (error) {
    console.error('Activate key error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}
