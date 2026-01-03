import { getPool } from './_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pool = getPool();
  const { action } = req.query;

  try {
    // Handle unread messages count
    if (action === 'unread') {
      return handleUnread(req, res, pool);
    }

    // Default messages handling
    if (req.method === 'GET') {
      const { userId, friendId } = req.query;
      
      if (!userId || !friendId) {
        return res.status(400).json({ success: false, message: 'userId and friendId required' });
      }

      const result = await pool.query(`
        SELECT 
          m.id,
          m.sender_id,
          m.receiver_id,
          m.content,
          m.is_read,
          m.created_at,
          u.username as sender_username,
          u.avatar as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = $1 AND m.receiver_id = $2)
           OR (m.sender_id = $2 AND m.receiver_id = $1)
        ORDER BY m.created_at ASC
        LIMIT 100
      `, [userId, friendId]);

      await pool.query(`
        UPDATE messages 
        SET is_read = true 
        WHERE sender_id = $2 AND receiver_id = $1 AND is_read = false
      `, [userId, friendId]);

      return res.status(200).json({ success: true, data: result.rows });
    }

    if (req.method === 'POST') {
      const { senderId, receiverId, content } = req.body;

      if (!senderId || !receiverId || !content) {
        return res.status(400).json({ 
          success: false, 
          message: 'senderId, receiverId and content required' 
        });
      }

      const friendshipResult = await pool.query(`
        SELECT * FROM friendships 
        WHERE status = 'accepted' 
        AND ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
      `, [senderId, receiverId]);

      if (friendshipResult.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only message friends' 
        });
      }

      const result = await pool.query(`
        INSERT INTO messages (sender_id, receiver_id, content)
        VALUES ($1, $2, $3)
        RETURNING id, sender_id, receiver_id, content, is_read, created_at
      `, [senderId, receiverId, content.trim()]);

      return res.status(201).json({ success: true, data: result.rows[0] });
    }

    if (req.method === 'PATCH') {
      const { userId, friendId } = req.body;

      if (!userId || !friendId) {
        return res.status(400).json({ success: false, message: 'userId and friendId required' });
      }

      await pool.query(`
        UPDATE messages 
        SET is_read = true 
        WHERE sender_id = $2 AND receiver_id = $1 AND is_read = false
      `, [userId, friendId]);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Messages API error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function handleUnread(req, res, pool) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId required' });
    }

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
