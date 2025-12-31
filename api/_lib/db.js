import { Pool } from 'pg';

// Singleton для connection pooling в serverless
let pool;

function getPgConfigFromDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    return null;
  }

  const url = new URL(databaseUrl);
  const database = url.pathname ? url.pathname.replace(/^\//, '') : '';

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : undefined,
    user: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    database,
  };
}

function getPool() {
  if (!pool) {
    const parsedConfig = getPgConfigFromDatabaseUrl(process.env.DATABASE_URL);
    pool = new Pool({
      ...(parsedConfig || { connectionString: process.env.DATABASE_URL }),
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
