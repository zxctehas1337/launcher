const { Pool } = require('pg');

// Database configuration from existing database.cjs
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

async function updateAvatarColumn() {
  let pool;
  
  try {
    // Initialize database connection
    const parsedConfig = getPgConfigFromDatabaseUrl(process.env.DATABASE_URL) || {
      host: 'dpg-d59u1ttactks73f0tghg-a.oregon-postgres.render.com',
      port: 5432,
      user: 'shakedown_lol_user',
      password: 'LX4RU4FHShipweoxnL2zxRYGAVcKqIf5',
      database: 'shakedown_lol'
    };
    pool = new Pool({
      ...parsedConfig,
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    console.log('🔄 Connecting to database...');
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully');

    // Step 1: Check current avatar column structure
    console.log('\n📋 Checking current avatar column structure...');
    const checkResult = await pool.query(`
      SELECT data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name='users' AND column_name='avatar'
    `);
    
    console.log('Current avatar column structure:');
    console.table(checkResult.rows);

    // Step 2: Alter column type from VARCHAR(255) to TEXT
    console.log('\n🔄 Altering avatar column type from VARCHAR(255) to TEXT...');
    await pool.query('ALTER TABLE users ALTER COLUMN avatar TYPE TEXT');
    console.log('✅ Avatar column type successfully changed to TEXT');

    // Step 3: Verify the change
    console.log('\n📋 Verifying updated avatar column structure...');
    const verifyResult = await pool.query(`
      SELECT data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name='users' AND column_name='avatar'
    `);
    
    console.log('Updated avatar column structure:');
    console.table(verifyResult.rows);

    console.log('\n🎉 Avatar column update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating avatar column:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  updateAvatarColumn()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateAvatarColumn };
