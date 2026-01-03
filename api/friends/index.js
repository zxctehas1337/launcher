import { getPool } from '../_lib/db.js';

// Ensure friends tables exist
async function ensureFriendsTables(pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)');
  } catch (error) {
    console.error('Error ensuring friends tables:', error);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pool = getPool();
  await ensureFriendsTables(pool);

  try {
    if (req.method === 'GET') {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId required' });
      }

      // Get all friends and pending requests
      const result = await pool.query(`
        SELECT 
          f.id,
          f.status,
          f.created_at,
          f.user_id,
          f.friend_id,
          CASE 
            WHEN f.user_id = $1 THEN u2.id
            ELSE u1.id
          END as friend_user_id,
          CASE 
            WHEN f.user_id = $1 THEN u2.username
            ELSE u1.username
          END as friend_username,
          CASE 
            WHEN f.user_id = $1 THEN u2.avatar
            ELSE u1.avatar
          END as friend_avatar,
          CASE 
            WHEN f.user_id = $1 THEN u2.last_active_at
            ELSE u1.last_active_at
          END as friend_last_active,
          CASE 
            WHEN f.user_id = $1 THEN 'outgoing'
            ELSE 'incoming'
          END as request_direction
        FROM friendships f
        JOIN users u1 ON f.user_id = u1.id
        JOIN users u2 ON f.friend_id = u2.id
        WHERE f.user_id = $1 OR f.friend_id = $1
        ORDER BY f.updated_at DESC
      `, [userId]);

      return res.status(200).json({ 
        success: true, 
        data: result.rows 
      });
    }

    if (req.method === 'POST') {
      const { userId, friendUsername, action } = req.body;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId required' });
      }

      // Accept friend request
      if (action === 'accept') {
        const { friendshipId } = req.body;
        await pool.query(`
          UPDATE friendships 
          SET status = 'accepted', updated_at = CURRENT_TIMESTAMP 
          WHERE id = $1 AND friend_id = $2
        `, [friendshipId, userId]);
        
        return res.status(200).json({ success: true, message: 'Friend request accepted' });
      }

      // Reject friend request
      if (action === 'reject') {
        const { friendshipId } = req.body;
        await pool.query(`
          DELETE FROM friendships WHERE id = $1 AND friend_id = $2
        `, [friendshipId, userId]);
        
        return res.status(200).json({ success: true, message: 'Friend request rejected' });
      }

      // Send friend request
      if (!friendUsername) {
        return res.status(400).json({ success: false, message: 'friendUsername required' });
      }

      // Find friend by username
      const friendResult = await pool.query(
        'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
        [friendUsername]
      );

      if (friendResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const friendId = friendResult.rows[0].id;

      if (friendId === parseInt(userId)) {
        return res.status(400).json({ success: false, message: 'Cannot add yourself' });
      }

      // Check if friendship already exists
      const existingResult = await pool.query(`
        SELECT * FROM friendships 
        WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
      `, [userId, friendId]);

      if (existingResult.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Friend request already exists' });
      }

      // Create friend request
      await pool.query(`
        INSERT INTO friendships (user_id, friend_id, status)
        VALUES ($1, $2, 'pending')
      `, [userId, friendId]);

      return res.status(201).json({ success: true, message: 'Friend request sent' });
    }

    if (req.method === 'DELETE') {
      const { friendshipId, userId } = req.body;

      if (!friendshipId || !userId) {
        return res.status(400).json({ success: false, message: 'friendshipId and userId required' });
      }

      await pool.query(`
        DELETE FROM friendships 
        WHERE id = $1 AND (user_id = $2 OR friend_id = $2)
      `, [friendshipId, userId]);

      return res.status(200).json({ success: true, message: 'Friend removed' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Friends API error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
