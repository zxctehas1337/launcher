import { getPool } from './_lib/db.js';

export default async (req, res) => {
  const { action, userId } = req.query;
  const pool = getPool();

  try {
    switch (action) {
      case 'get':
        return await handleGet(req, res, pool, userId);
      case 'set':
        return await handleSet(req, res, pool);
      case 'reset':
        return await handleReset(req, res, pool);
      case 'verify':
        return await handleVerify(req, res, pool);
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('HWID error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

async function handleGet(req, res, pool, userId) {
  if (!userId) {
    return res.json({ success: false, message: 'Не указан userId' });
  }

  const result = await pool.query('SELECT hwid FROM users WHERE id = $1', [userId]);

  if (result.rows.length === 0) {
    return res.json({ success: false, message: 'Пользователь не найден' });
  }

  res.json({ success: true, hwid: result.rows[0].hwid || null });
}

async function handleSet(req, res, pool) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId, hwid } = req.body;

  if (!userId || !hwid) {
    return res.json({ success: false, message: 'Не указан userId или hwid' });
  }

  const existingHwid = await pool.query(
    'SELECT id, username FROM users WHERE hwid = $1 AND id != $2',
    [hwid, userId]
  );

  if (existingHwid.rows.length > 0) {
    return res.json({ success: false, message: 'Этот HWID уже привязан к другому аккаунту' });
  }

  const userResult = await pool.query('SELECT hwid FROM users WHERE id = $1', [userId]);

  if (userResult.rows.length === 0) {
    return res.json({ success: false, message: 'Пользователь не найден' });
  }

  const currentHwid = userResult.rows[0].hwid;

  if (currentHwid && currentHwid !== hwid) {
    return res.json({ success: false, message: 'HWID уже привязан. Для смены требуется сброс.' });
  }

  await pool.query('UPDATE users SET hwid = $1 WHERE id = $2', [hwid, userId]);

  res.json({ success: true, message: 'HWID успешно привязан' });
}

async function handleReset(req, res, pool) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.json({ success: false, message: 'Не указан userId' });
  }

  await pool.query('UPDATE users SET hwid = NULL WHERE id = $1', [userId]);
  res.json({ success: true, message: 'HWID успешно сброшен' });
}

async function handleVerify(req, res, pool) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId, hwid } = req.body;

  if (!userId || !hwid) {
    return res.json({ success: false, message: 'Не указан userId или hwid' });
  }

  const result = await pool.query(
    'SELECT hwid, subscription, is_banned FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return res.json({ success: false, message: 'Пользователь не найден' });
  }

  const user = result.rows[0];

  if (user.is_banned) {
    return res.json({ success: false, message: 'Аккаунт заблокирован' });
  }

  if (!user.hwid) {
    await pool.query('UPDATE users SET hwid = $1 WHERE id = $2', [hwid, userId]);
    return res.json({ success: true, message: 'HWID привязан', subscription: user.subscription });
  }

  if (user.hwid !== hwid) {
    return res.json({ success: false, message: 'HWID не совпадает. Требуется сброс привязки.' });
  }

  res.json({ success: true, message: 'HWID подтвержден', subscription: user.subscription });
}
