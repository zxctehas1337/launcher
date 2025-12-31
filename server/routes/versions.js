const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.js');

// Получение всех версий (для админки)
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, version, download_url, description, is_active, created_at
       FROM client_versions
       ORDER BY created_at DESC, id DESC`
    );

    const versions = result.rows.map(v => ({
      id: v.id,
      version: v.version,
      downloadUrl: v.download_url,
      description: v.description,
      isActive: v.is_active,
      createdAt: v.created_at
    }));

    res.json({ success: true, data: versions });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Создание версии
router.post('/', async (req, res) => {
  const { version, downloadUrl, description, isActive } = req.body || {};

  if (!version || !downloadUrl) {
    return res.status(400).json({ success: false, message: 'version и downloadUrl обязательны' });
  }

  try {
    if (isActive) {
      await pool.query('UPDATE client_versions SET is_active = false WHERE is_active = true');
    }

    const result = await pool.query(
      `INSERT INTO client_versions (version, download_url, description, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, version, download_url, description, is_active, created_at`,
      [String(version).trim(), String(downloadUrl).trim(), description ?? null, Boolean(isActive)]
    );

    const v = result.rows[0];

    res.json({
      success: true,
      data: {
        id: v.id,
        version: v.version,
        downloadUrl: v.download_url,
        description: v.description,
        isActive: v.is_active,
        createdAt: v.created_at
      }
    });
  } catch (error) {
    console.error('Create version error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Обновление версии
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { version, downloadUrl, description, isActive } = req.body || {};

  try {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (version !== undefined) {
      fields.push(`version = $${paramCount}`);
      values.push(String(version).trim());
      paramCount++;
    }

    if (downloadUrl !== undefined) {
      fields.push(`download_url = $${paramCount}`);
      values.push(String(downloadUrl).trim());
      paramCount++;
    }

    if (description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(description ?? null);
      paramCount++;
    }

    if (isActive !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      values.push(Boolean(isActive));
      paramCount++;
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'Нет полей для обновления' });
    }

    if (isActive) {
      await pool.query('UPDATE client_versions SET is_active = false WHERE is_active = true');
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE client_versions SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, version, download_url, description, is_active, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'Версия не найдена' });
    }

    const v = result.rows[0];

    res.json({
      success: true,
      data: {
        id: v.id,
        version: v.version,
        downloadUrl: v.download_url,
        description: v.description,
        isActive: v.is_active,
        createdAt: v.created_at
      }
    });
  } catch (error) {
    console.error('Update version error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Удаление версии
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM client_versions WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'Версия не найдена' });
    }

    res.json({ success: true, message: 'Версия удалена' });
  } catch (error) {
    console.error('Delete version error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

module.exports = router;
