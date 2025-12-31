const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.js');

// Публичный эндпоинт для лаунчера: получить активную (или последнюю) версию
router.get('/version', async (_req, res) => {
  try {
    // 1) активная версия
    const active = await pool.query(
      `SELECT id, version, download_url, description, created_at
       FROM client_versions
       WHERE is_active = true
       ORDER BY created_at DESC, id DESC
       LIMIT 1`
    );

    let row = active.rows[0];

    // 2) fallback: последняя по дате
    if (!row) {
      const latest = await pool.query(
        `SELECT id, version, download_url, description, created_at
         FROM client_versions
         ORDER BY created_at DESC, id DESC
         LIMIT 1`
      );
      row = latest.rows[0];
    }

    if (!row) {
      return res.json({ success: false, message: 'Версии клиента не найдены' });
    }

    res.json({
      success: true,
      data: {
        version: row.version,
        downloadUrl: row.download_url,
        changelog: row.description
      }
    });
  } catch (error) {
    console.error('Get client version error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

module.exports = router;
