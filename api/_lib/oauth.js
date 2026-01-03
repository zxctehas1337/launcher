import crypto from 'crypto';
import { getPool } from './db.js';

// Поля для OAuth (без settings чтобы не раздувать URL)
const OAUTH_USER_FIELDS = 'id, username, email, subscription, subscription_end_date, avatar, registered_at, is_admin, is_banned, email_verified, hwid, oauth_provider, oauth_id';

export async function findOrCreateOAuthUser(profile, provider, hwid) {
  const pool = getPool();
  const email = profile.email || `${profile.id}@${provider}.oauth`;
  const username = profile.name || profile.login || `${provider}_${profile.id}`;

  try {
    let result = await pool.query(`SELECT ${OAUTH_USER_FIELDS} FROM users WHERE email = $1`, [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      await pool.query(
        'UPDATE users SET oauth_provider = $1, oauth_id = $2, email_verified = true, avatar = COALESCE($4, avatar), hwid = COALESCE($5, hwid) WHERE id = $3',
        [provider, profile.id, user.id, profile.avatar, hwid]
      );
      // Возвращаем обновлённые данные
      const updated = await pool.query(`SELECT ${OAUTH_USER_FIELDS} FROM users WHERE id = $1`, [user.id]);
      return updated.rows[0];
    }

    let uniqueUsername = username;
    let counter = 1;
    while (true) {
      const usernameCheck = await pool.query('SELECT id FROM users WHERE username = $1', [uniqueUsername]);
      if (usernameCheck.rows.length === 0) break;
      uniqueUsername = `${username}_${counter}`;
      counter++;
    }

    result = await pool.query(
      `INSERT INTO users (username, email, password, oauth_provider, oauth_id, email_verified, subscription, avatar, hwid) 
       VALUES ($1, $2, $3, $4, $5, true, 'free', $6, $7) 
       RETURNING ${OAUTH_USER_FIELDS}`,
      [uniqueUsername, email, crypto.randomBytes(32).toString('hex'), provider, profile.id, profile.avatar, hwid]
    );

    return result.rows[0];
  } catch (error) {
    console.error(`OAuth ${provider} error:`, error);
    throw error;
  }
}
