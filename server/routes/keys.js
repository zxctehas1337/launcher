const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.js');

// Получение всех ключей (для админки)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lk.*, u.username as created_by_name, used_user.username as used_by_name 
       FROM license_keys lk 
       LEFT JOIN users u ON lk.created_by = u.id 
       LEFT JOIN users used_user ON lk.used_by = used_user.id 
       ORDER BY lk.created_at DESC`
    );

    const keys = result.rows.map(key => ({
      id: key.id,
      key: key.key,
      product: key.product,
      duration: key.duration_days,
      isUsed: key.is_used,
      usedBy: key.used_by,
      usedAt: key.used_at,
      createdAt: key.created_at,
      createdBy: key.created_by,
      createdByName: key.created_by_name,
      usedByName: key.used_by_name
    }));

    res.json({ success: true, data: keys });
  } catch (error) {
    console.error('Get keys error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Создание новых ключей
router.post('/', async (req, res) => {
  const { keys } = req.body;

  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({ success: false, message: 'Неверный формат данных' });
  }

  try {
    const createdKeys = [];

    for (const keyData of keys) {
      const result = await pool.query(
        `INSERT INTO license_keys (key, product, duration_days, created_by) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, key, product, duration_days, is_used, created_at`,
        [keyData.key, keyData.product, keyData.duration, keyData.createdBy]
      );

      createdKeys.push(result.rows[0]);
    }

    res.json({ success: true, data: createdKeys });
  } catch (error) {
    console.error('Create keys error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Активация ключа
router.post('/activate', async (req, res) => {
  const { key, userId } = req.body;

  if (!key || !userId) {
    return res.status(400).json({ success: false, message: 'Ключ и ID пользователя обязательны' });
  }

  try {
    // Проверка существования ключа
    const keyResult = await pool.query(
      'SELECT * FROM license_keys WHERE key = $1',
      [key.toUpperCase()]
    );

    if (keyResult.rows.length === 0) {
      return res.json({ success: false, message: 'Ключ не найден' });
    }

    const licenseKey = keyResult.rows[0];

    if (licenseKey.is_used) {
      return res.json({ success: false, message: 'Ключ уже использован' });
    }

    // Активация ключа
    await pool.query(
      `UPDATE license_keys 
       SET is_used = true, used_by = $1, used_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [userId, licenseKey.id]
    );

    // Обновление подписки пользователя
    let newSubscription = 'free';
    if (licenseKey.product === 'premium' || licenseKey.product === 'inside-client') {
      newSubscription = 'premium';
    } else if (licenseKey.product === 'alpha') {
      newSubscription = 'alpha';
    }

    await pool.query(
      'UPDATE users SET subscription = $1 WHERE id = $2',
      [newSubscription, userId]
    );

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
});

// Удаление ключа
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM license_keys WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'Ключ не найден' });
    }

    res.json({ success: true, message: 'Ключ удален' });
  } catch (error) {
    console.error('Delete key error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

module.exports = router;
