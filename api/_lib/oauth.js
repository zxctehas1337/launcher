import crypto from 'crypto';
import { getPool } from './db.js';

export async function findOrCreateOAuthUser(profile, provider) {
  const pool = getPool();
  const email = profile.email || `${profile.id}@${provider}.oauth`;
  const username = profile.name || profile.login || `${provider}_${profile.id}`;
  
  try {
    let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      await pool.query(
        'UPDATE users SET oauth_provider = $1, oauth_id = $2, email_verified = true WHERE id = $3',
        [provider, profile.id, user.id]
      );
      return user;
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
      `INSERT INTO users (username, email, password, oauth_provider, oauth_id, email_verified, subscription) 
       VALUES ($1, $2, $3, $4, $5, true, 'free') 
       RETURNING *`,
      [uniqueUsername, email, crypto.randomBytes(32).toString('hex'), provider, profile.id]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error(`OAuth ${provider} error:`, error);
    throw error;
  }
}
