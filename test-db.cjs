const { Pool } = require('pg');

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  
  if (!process.env.DATABASE_URL) {
    require('dotenv').config();
    console.log('After dotenv load:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  }
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
    });

    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully');
    
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('Database time:', result.rows[0].current_time);
    console.log('Database version:', result.rows[0].version.split(' ')[0]);
    
    await client.release();
    await pool.end();
    console.log('✅ Connection test completed');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
