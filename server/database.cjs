const { Pool } = require('pg');

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

// Инициализация базы данных
async function initDatabase() {
  try {
    const pool = getPool();
    await pool.query('SELECT 1'); // Test connection
    console.log('✅ Database connected successfully');
    
    // Создаем таблицы автоматически
    await createTables(pool);
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Автоматическое создание таблиц
async function createTables(pool) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Создание таблицы users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          oauth_provider VARCHAR(50),
          oauth_id VARCHAR(100),
          email_verified BOOLEAN DEFAULT false,
          subscription VARCHAR(20) DEFAULT 'free',
          avatar VARCHAR(255),
          registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          is_admin BOOLEAN DEFAULT false,
          is_banned BOOLEAN DEFAULT false,
          settings JSONB,
          hwid VARCHAR(255),
          CONSTRAINT unique_oauth UNIQUE (oauth_provider, oauth_id)
      )
    `);
    
    // Добавление колонок верификации если их нет
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'users'
                AND column_name = 'verification_code'
          ) THEN
              ALTER TABLE users 
              ADD COLUMN verification_code VARCHAR(6),
              ADD COLUMN verification_code_expires TIMESTAMP WITH TIME ZONE;
          END IF;
      END $$;
    `);
    
    // Добавление колонки subscription_end_date если её нет
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'users'
                AND column_name = 'subscription_end_date'
          ) THEN
              ALTER TABLE users 
              ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;
          END IF;
      END $$;
    `);
    
    // Создание таблицы license_keys
    await client.query(`
      CREATE TABLE IF NOT EXISTS license_keys (
          id SERIAL PRIMARY KEY,
          key VARCHAR(50) UNIQUE NOT NULL,
          product VARCHAR(50) NOT NULL,
          duration_days INTEGER NOT NULL,
          is_used BOOLEAN DEFAULT false,
          used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          notes TEXT
      )
    `);
    
    // Создание таблицы client_versions
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_versions (
          id SERIAL PRIMARY KEY,
          version VARCHAR(50) UNIQUE NOT NULL,
          download_url TEXT NOT NULL,
          is_active BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Добавление колонки description если её нет
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'client_versions'
                AND column_name = 'description'
          ) THEN
              ALTER TABLE client_versions 
              ADD COLUMN description TEXT DEFAULT 'Версия клиента';
          END IF;
      END $$;
    `);
    
    // Создание индексов
    await client.query('CREATE INDEX IF NOT EXISTS idx_license_keys_key ON license_keys(key)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_license_keys_used_by ON license_keys(used_by)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_license_keys_product ON license_keys(product)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_hwid ON users(hwid)');
    
    // Создание индекса для verification_code только если колонка существует
    await client.query(`
      DO $$
      BEGIN
          IF EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'users'
                AND column_name = 'verification_code'
          ) THEN
              CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(verification_code);
          END IF;
      END $$;
    `);
    
    await client.query('COMMIT');
    console.log('✅ All tables and indexes created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool: getPool(), initDatabase };
