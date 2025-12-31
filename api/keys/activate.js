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
    let subscriptionEndDate = null;
    
    if (licenseKey.product === 'premium' || licenseKey.product === 'inside-client') {
      newSubscription = 'premium';
    } else if (licenseKey.product === 'alpha') {
      newSubscription = 'alpha';
    }

    // Calculate subscription end date
    // - duration_days === 0 => lifetime (store NULL)
    // - duration_days > 0 => extend from current subscription_end_date if it's in the future
    if (licenseKey.duration_days > 0) {
      let baseDate = new Date();

      try {
        const currentResult = await pool.query(
          'SELECT subscription_end_date FROM users WHERE id = $1',
          [userId]
        );

        const currentEnd = currentResult.rows?.[0]?.subscription_end_date;

        // If user already has lifetime access, keep it lifetime
        if (currentEnd === null) {
          subscriptionEndDate = null;
        } else if (currentEnd) {
          const currentEndDate = new Date(currentEnd);
          if (!Number.isNaN(currentEndDate.getTime()) && currentEndDate > baseDate) {
            baseDate = currentEndDate;
          }
        }
      } catch (columnError) {
        // Backwards compatibility: if subscription_end_date doesn't exist, fall back to now
      }

      if (subscriptionEndDate !== null) {
        const endDate = new Date(baseDate);
        endDate.setDate(endDate.getDate() + licenseKey.duration_days);
        subscriptionEndDate = endDate.toISOString();
      }
    }

    try {
      // Try to update with subscription_end_date
      await pool.query(
        'UPDATE users SET subscription = $1, subscription_end_date = $2 WHERE id = $3', 
        [newSubscription, subscriptionEndDate, userId]
      );
    } catch (columnError) {
      // Fallback to update without subscription_end_date if column doesn't exist
      await pool.query('UPDATE users SET subscription = $1 WHERE id = $2', [newSubscription, userId]);
    }

    res.json({
      success: true,
      message: 'Ключ активирован',
      data: {
        product: licenseKey.product,
        duration: licenseKey.duration_days,
        newSubscription,
        subscriptionEndDate
      }
    });
  } catch (error) {
    console.error('Activate key error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}
