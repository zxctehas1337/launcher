const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.js');

// Получить HWID пользователя
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query('SELECT hwid FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'Пользователь не найден' });
    }

    res.json({ success: true, hwid: result.rows[0].hwid || null });
  } catch (error) {
    console.error('Get HWID error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Установить/обновить HWID пользователя
router.post('/set', async (req, res) => {
  const { userId, hwid } = req.body;

  if (!userId || !hwid) {
    return res.json({ success: false, message: 'Не указан userId или hwid' });
  }

  try {
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
  } catch (error) {
    console.error('Set HWID error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Сбросить HWID пользователя
router.post('/reset', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.json({ success: false, message: 'Не указан userId' });
  }

  try {
    await pool.query('UPDATE users SET hwid = NULL WHERE id = $1', [userId]);
    res.json({ success: true, message: 'HWID успешно сброшен' });
  } catch (error) {
    console.error('Reset HWID error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Проверить HWID
router.post('/verify', async (req, res) => {
  const { userId, hwid } = req.body;

  if (!userId || !hwid) {
    return res.json({ success: false, message: 'Не указан userId или hwid' });
  }

  try {
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
  } catch (error) {
    console.error('Verify HWID error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

module.exports = router;
