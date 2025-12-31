// Скрипт создания/обновления админа
// Запуск: node server/scripts/create-admin.js

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['ADMIN_USERNAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Ошибка: Отсутствует обязательная переменная окружения ${envVar}`);
    process.exit(1);
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Always use SSL for the admin script
});

async function createOrUpdateAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Check if admin already exists
    const existing = await pool.query(
      'SELECT id, username, email FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existing.rows.length > 0) {
      // Update existing admin password
      await pool.query(
        'UPDATE users SET password = $1, is_admin = true, email_verified = true WHERE id = $2',
        [hashedPassword, existing.rows[0].id]
      );
      
      console.log('✅ Пароль админа обновлен:');
      console.log(`   ID: ${existing.rows[0].id}`);
      console.log(`   Username: ${existing.rows[0].username}`);
      console.log(`   Email: ${existing.rows[0].email}`);
    } else {
      // Create new admin
      const result = await pool.query(
        `INSERT INTO users (username, email, password, is_admin, email_verified, subscription)
         VALUES ($1, $2, $3, true, true, 'premium')
         RETURNING id, username, email`,
        [username, email, hashedPassword]
      );

      console.log('✅ Админ создан:');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Username: ${result.rows[0].username}`);
      console.log(`   Email: ${result.rows[0].email}`);
    }
    
    console.log(`   Пароль: ${process.env.ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

createOrUpdateAdmin();
