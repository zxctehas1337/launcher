// Script to clean up non-admin users from the database
// Usage: node server/scripts/cleanup-users.js

import { Pool } from 'pg';
import 'dotenv/config';
import readline from 'readline';

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nihmadev:PdRLZGRdUGylo6Q8qCW1B1sbaoXNwqmh@dpg-d4bp826uk2gs73de38qg-a.oregon-postgres.render.com/looser',
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
  max: 20
});

async function cleanupUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Connecting to database...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // First, get count of non-admin users
    const countResult = await client.query(
      'SELECT COUNT(*) FROM users WHERE is_admin = false'
    );
    const userCount = parseInt(countResult.rows[0].count, 10);
    
    if (userCount === 0) {
      console.log('ℹ️ No non-admin users found to delete.');
      await client.query('COMMIT');
      return;
    }
    
    console.log(`⚠️  WARNING: This will delete ${userCount} non-admin users.`);
    console.log('❌ This action cannot be undone!');
    
    // Ask for confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('Are you sure you want to continue? (yes/no) ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.');
      await client.query('ROLLBACK');
      return;
    }
    
    // Delete non-admin users
    console.log('🗑️  Deleting non-admin users...');
    const deleteResult = await client.query(
      'DELETE FROM users WHERE is_admin = false RETURNING id, username, email'
    );
    
    await client.query('COMMIT');
    
    console.log(`✅ Successfully deleted ${deleteResult.rowCount} non-admin users.`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup
cleanupUsers()
  .then(() => {
    console.log('✨ Cleanup completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
