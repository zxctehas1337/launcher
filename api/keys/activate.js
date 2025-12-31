import { getPool, ensureUserSchema } from '../_lib/db.js';

export default async function handler(req, res) {
  const pool = getPool();

  await ensureUserSchema(pool);

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
      let hasLifetime = false;

      try {
        const currentResult = await pool.query(
          'SELECT subscription, subscription_end_date FROM users WHERE id = $1',
          [userId]
        );

        const currentRow = currentResult.rows?.[0];
        const currentSub = String(currentRow?.subscription || 'free').trim().toLowerCase();
        const currentEnd = currentRow?.subscription_end_date;

        // Treat NULL end date as lifetime only if user has actually used a lifetime key
        if (currentEnd === null && (currentSub === 'premium' || currentSub === 'alpha')) {
          try {
            const lifetimeKeyResult = await pool.query(
              'SELECT 1 FROM license_keys WHERE used_by = $1 AND duration_days = 0 LIMIT 1',
              [userId]
            );
            hasLifetime = lifetimeKeyResult.rows.length > 0;
          } catch (lifetimeCheckError) {
            hasLifetime = false;
          }
        } else if (currentEnd) {
          const currentEndDate = new Date(currentEnd);
          if (!Number.isNaN(currentEndDate.getTime()) && currentEndDate > baseDate) {
            baseDate = currentEndDate;
          }
        }
      } catch (columnError) {
        // Backwards compatibility: if subscription_end_date doesn't exist, fall back to now
      }

      if (!hasLifetime) {
        const endDate = new Date(baseDate);
        endDate.setDate(endDate.getDate() + licenseKey.duration_days);
        subscriptionEndDate = endDate.toISOString();
      } else {
        subscriptionEndDate = null;
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

    try {
      const verifyResult = await pool.query(
        'SELECT subscription, subscription_end_date FROM users WHERE id = $1',
        [userId]
      );
      const verifyRow = verifyResult.rows?.[0];
      if (verifyRow) {
        newSubscription = String(verifyRow.subscription || newSubscription).trim().toLowerCase();
        subscriptionEndDate = verifyRow.subscription_end_date ?? null;
      }
    } catch (verifyError) {
      console.error('Verify subscription end date error:', verifyError);
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
