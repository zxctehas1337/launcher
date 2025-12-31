// Script to fix password encoding for all users
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render's managed PostgreSQL
  },
  connectionTimeoutMillis: 10000, // 10 seconds
  idleTimeoutMillis: 10000,
  max: 20
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('   Database time:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    if (error.code) console.error('   Error code:', error.code);
    return false;
  }
}

const SALT_ROUNDS = 10;

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, SALT_ROUNDS, (error, hashed) => {
      if (error) return reject(error);
      resolve(hashed);
    });
  });
}

async function fixPasswordEncoding() {
  if (!await testConnection()) {
    console.log('❌ Exiting due to connection failure');
    process.exit(1);
  }

  try {
    console.log('🔍 Fetching all users...');
    const result = await pool.query('SELECT id, username, email, password FROM users');
    
    if (result.rows.length === 0) {
      console.log('ℹ️  No users found in the database');
      return;
    }

    console.log(`ℹ️  Found ${result.rows.length} users`);
    let fixedCount = 0;

    for (const user of result.rows) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Skip empty passwords
        if (!user.password) {
          console.log(`   Skipping user ${user.username} - no password set`);
          continue;
        }

        if (user.password.startsWith('$2')) {
          console.log(`   User ${user.username} - already using bcrypt`);
          await client.query('COMMIT');
          continue;
        }

        let plainPassword = null;

        try {
          const decoded = Buffer.from(user.password, 'base64').toString('utf-8');
          if (Buffer.from(decoded).toString('base64') === user.password) {
            plainPassword = decoded;
          }
        } catch (e) {
          // not base64, fall through
        }

        if (!plainPassword) {
          plainPassword = user.password;
        }

        const hashedPassword = await hashPassword(plainPassword);

        await client.query(
          'UPDATE users SET password = $1 WHERE id = $2',
          [hashedPassword, user.id]
        );

        console.log(`✅ Rehashed password for user: ${user.username} (${user.email})`);
        await client.query('COMMIT');
        fixedCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error processing user ${user.username || 'unknown'} (ID: ${user.id}):`, error.message);
      } finally {
        client.release();
      }
    }

    console.log(`\n✨ Password encoding fix complete!`);
    console.log(`   Total users processed: ${result.rows.length}`);
    console.log(`   Passwords fixed: ${fixedCount}`);
    
  } catch (error) {
    console.error('❌ Error in fixPasswordEncoding:', error.message);
    if (error.code) console.error('   Error code:', error.code);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the script
fixPasswordEncoding();