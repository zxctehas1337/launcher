import bcrypt from 'bcryptjs';
import { getPool } from './_lib/db.js';
import { generateVerificationCode, sendVerificationEmail } from './_lib/email.js';
import { mapUserFromDb } from './_lib/userMapper.js';

const SALT_ROUNDS = 10;

const hashPassword = (password) =>
  new Promise((resolve, reject) => {
    bcrypt.hash(password, SALT_ROUNDS, (error, hashed) => {
      if (error) return reject(error);
      resolve(hashed);
    });
  });

const comparePassword = (password, hashed) =>
  new Promise((resolve, reject) => {
    bcrypt.compare(password, hashed, (error, same) => {
      if (error) return reject(error);
      resolve(same);
    });
  });

const rehashLegacyPassword = async (pool, userId, password) => {
  const hashedPassword = await hashPassword(password);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
  return hashedPassword;
};

const passwordsMatch = async (pool, user, inputPassword) => {
  if (!user.password) {
    return false;
  }

  if (user.password.startsWith('$2')) {
    return await comparePassword(inputPassword, user.password);
  }

  if (user.password === inputPassword) {
    await rehashLegacyPassword(pool, user.id, inputPassword);
    return true;
  }

  const encodedInput = Buffer.from(inputPassword).toString('base64');

  if (user.password === encodedInput) {
    await rehashLegacyPassword(pool, user.id, inputPassword);
    return true;
  }

  try {
    const decodedStored = Buffer.from(user.password, 'base64').toString('utf-8');
    if (decodedStored === inputPassword) {
      await rehashLegacyPassword(pool, user.id, inputPassword);
      return true;
    }
  } catch (error) {
    // ignore decoding errors
  }

  return false;
};

export default async (req, res) => {
  const { action } = req.query;
  const pool = getPool();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    switch (action) {
      case 'login':
        return await handleLogin(req, res, pool);
      case 'register':
        return await handleRegister(req, res, pool);
      case 'resend-code':
        return await handleResendCode(req, res, pool);
      case 'verify-code':
        return await handleVerifyCode(req, res, pool);
      case 'local_auth_test':
        return await handleLocalAuthTest(req, res, pool);
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

async function handleLogin(req, res, pool) {
  const { usernameOrEmail, password, hwid } = req.body;

  const result = await pool.query(
    `SELECT id, username, email, password, subscription, registered_at, is_admin, is_banned, email_verified, settings, avatar, hwid
     FROM users 
     WHERE (username = $1 OR email = $1)
     LIMIT 1`,
    [usernameOrEmail]
  );

  if (result.rows.length === 0) {
    return res.json({ success: false, message: 'Неверный логин или пароль' });
  }

  const dbUser = result.rows[0];

  const isPasswordValid = await passwordsMatch(pool, dbUser, password);

  if (!isPasswordValid) {
    return res.json({ success: false, message: 'Неверный логин или пароль' });
  }

  if (dbUser.is_banned) {
    return res.json({ success: false, message: 'Ваш аккаунт заблокирован' });
  }

  // Обновляем HWID если передан
  if (hwid) {
    await pool.query('UPDATE users SET hwid = $1 WHERE id = $2', [hwid, dbUser.id]);
    dbUser.hwid = hwid;
  }

  res.json({ success: true, message: 'Вход выполнен!', data: mapUserFromDb(dbUser) });
}

async function handleRegister(req, res, pool) {
  const { username, email, password, hwid } = req.body;

  const existingUser = await pool.query(
    'SELECT * FROM users WHERE username = $1 OR email = $2',
    [username, email]
  );

  if (existingUser.rows.length > 0) {
    const existing = existingUser.rows[0];
    if (existing.username === username) {
      return res.json({ success: false, message: 'Пользователь с таким логином уже существует' });
    }
    if (existing.email === email) {
      return res.json({ success: false, message: 'Email уже зарегистрирован' });
    }
  }

  const verificationCode = generateVerificationCode();
  const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

  const hashedPassword = await hashPassword(password);

  const result = await pool.query(
    `INSERT INTO users (username, email, password, verification_code, verification_code_expires, email_verified, hwid) 
     VALUES ($1, $2, $3, $4, $5, false, $6) 
     RETURNING id, username, email, subscription, registered_at, is_admin, is_banned, email_verified, settings, avatar, hwid`,
    [username, email, hashedPassword, verificationCode, codeExpires, hwid]
  );

  const user = mapUserFromDb(result.rows[0]);
  const emailSent = await sendVerificationEmail(email, username, verificationCode);

  if (emailSent) {
    res.json({
      success: true,
      message: 'Код подтверждения отправлен на email',
      requiresVerification: true,
      data: user
    });
  } else {
    res.json({ success: false, message: 'Ошибка отправки кода. Попробуйте позже.' });
  }
}

async function handleResendCode(req, res, pool) {
  const { userId } = req.body;

  if (!userId) {
    return res.json({ success: false, message: 'Не указан ID пользователя' });
  }

  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

  if (result.rows.length === 0) {
    return res.json({ success: false, message: 'Пользователь не найден' });
  }

  const user = result.rows[0];

  if (user.email_verified) {
    return res.json({ success: false, message: 'Email уже подтвержден' });
  }

  const verificationCode = generateVerificationCode();
  const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    'UPDATE users SET verification_code = $1, verification_code_expires = $2 WHERE id = $3',
    [verificationCode, codeExpires, userId]
  );

  const emailSent = await sendVerificationEmail(user.email, user.username, verificationCode);

  if (emailSent) {
    res.json({ success: true, message: 'Новый код отправлен на email' });
  } else {
    res.json({ success: false, message: 'Ошибка отправки кода' });
  }
}

async function handleVerifyCode(req, res, pool) {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.json({ success: false, message: 'Не указан ID пользователя или код' });
  }

  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

  if (result.rows.length === 0) {
    return res.json({ success: false, message: 'Пользователь не найден' });
  }

  const user = result.rows[0];

  if (new Date() > new Date(user.verification_code_expires)) {
    return res.json({ success: false, message: 'Код истек. Запросите новый код.' });
  }

  if (user.verification_code !== code) {
    return res.json({ success: false, message: 'Неверный код подтверждения' });
  }

  await pool.query(
    'UPDATE users SET email_verified = true, verification_code = NULL, verification_code_expires = NULL WHERE id = $1',
    [userId]
  );

  res.json({ success: true, message: 'Email успешно подтвержден!' });
}

// Скрытая функция для локального тестирования
// Создает фейкового пользователя без базы данных
async function handleLocalAuthTest(req, res, pool) {
  // Проверка что запрос с localhost или локальной сети
  const host = req.headers.host || '';
  const origin = req.headers.origin || '';
  const localHosts = ['localhost', '127.0.0.1', '192.168.', '10.0.', '172.16.'];
  const localPorts = [':3000', ':8060', ':8080', ':5173', ':4173'];

  const isLocalHost = localHosts.some(h => host.includes(h) || origin.includes(h));
  const isLocalPort = localPorts.some(p => host.includes(p) || origin.includes(p));
  const isLocal = isLocalHost || isLocalPort;

  if (!isLocal) {
    return res.status(403).json({ success: false, message: 'Доступно только для локальной сети' });
  }

  const { username = 'test_user', email = 'test@local.dev', password = 'test123' } = req.body;

  // Создаем фейкового пользователя для тестирования без обращения к БД
  const fakeUser = {
    id: 999,
    username: username,
    email: email,
    subscription: 'free',
    registered_at: new Date().toISOString(),
    is_admin: false,
    is_banned: false,
    email_verified: true,
    settings: JSON.stringify({})
  };

  return res.json({
    success: true,
    message: 'Тестовый вход выполнен!',
    data: mapUserFromDb(fakeUser),
    isTestAuth: true
  });
}
