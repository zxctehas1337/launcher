import { Pool } from 'pg';

// Singleton для connection pooling в serverless
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1, // Reduce max connections for serverless
      idleTimeoutMillis: 10000, // Reduce idle timeout
      connectionTimeoutMillis: 5000, // Reduce connection timeout
      allowExitOnIdle: true // Allow process to exit when idle
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
      // Reset pool on error
      pool = null;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      if (pool) {
        await pool.end();
        console.log('Database pool closed');
      }
      process.exit(0);
    });
  }
  return pool;
}

export { getPool };
