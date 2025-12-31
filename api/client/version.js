import { getPool } from '../_lib/db.js';

export default async function handler(req, res) {
  const pool = getPool();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const active = await pool.query(
      `SELECT id, version, download_url, description, created_at
       FROM client_versions
       WHERE is_active = true
       ORDER BY created_at DESC, id DESC
       LIMIT 1`
    );

    let row = active.rows[0];

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
      res.json({ success: false, message: 'Версии клиента не найдены' });
      return;
    }

    res.json({
      success: true,
      data: {
        version: row.version,
        downloadUrl: row.download_url,
        changelog: row.description,
        updatedAt: row.created_at ? new Date(row.created_at).toISOString() : null
      }
    });
  } catch (error) {
    console.error('Client version API error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}
