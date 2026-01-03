import { getPool } from '../_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const pool = getPool();

  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId required' });
    }

    // Get unread message counts grouped by sender
    const result = await pool.query(`
      SELECT 
        m.sender_id,
        COUNT(*) as unread_count,
        u.username as sender_username
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.receiver_id = $1 AND m.is_read = false
      GROUP BY m.sender_id, u.username
    `, [userId]);

    // Get total unread count
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total_unread
      FROM messages
      WHERE receiver_id = $1 AND is_read = false
    `, [userId]);

    return res.status(200).json({ 
      success: true, 
      data: {
        byUser: result.rows,
        total: parseInt(totalResult.rows[0].total_unread) || 0
      }
    });
  } catch (error) {
    console.error('Unread messages API error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
