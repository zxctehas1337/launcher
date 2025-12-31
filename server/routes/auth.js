const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database.js');
const { generateVerificationCode, sendVerificationEmail } = require('../services/email.js');
const { mapUserFromDb } = require('../utils/userMapper.js');

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

const rehashLegacyPassword = async (userId, password) => {
  const hashedPassword = await hashPassword(password);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
  return hashedPassword;
};

const passwordsMatch = async (user, inputPassword) => {
  if (!user.password) {
    return false;
  }

  if (user.password.startsWith('$2')) {
    return comparePassword(inputPassword, user.password);
  }

  if (user.password === inputPassword) {
    await rehashLegacyPassword(user.id, inputPassword);
    return true;
  }

  const encodedInput = Buffer.from(inputPassword).toString('base64');

  if (user.password === encodedInput) {
    await rehashLegacyPassword(user.id, inputPassword);
    return true;
  }

  try {
    const decodedStored = Buffer.from(user.password, 'base64').toString('utf-8');
    if (decodedStored === inputPassword) {
      await rehashLegacyPassword(user.id, inputPassword);
      return true;
    }
  } catch (error) {
    // ignore decoding errors
  }

  return false;
};

// Регистрация
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
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
      `INSERT INTO users (username, email, password, verification_code, verification_code_expires, email_verified) 
       VALUES ($1, $2, $3, $4, $5, false) 
       RETURNING id, username, email, subscription, registered_at, is_admin, is_banned, email_verified, settings`,
      [username, email, hashedPassword, verificationCode, codeExpires]
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
      res.json({ 
        success: false, 
        message: 'Ошибка отправки кода. Попробуйте позже.'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Вход
router.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT id, username, email, password, subscription, registered_at, is_admin, is_banned, email_verified, settings 
       FROM users 
       WHERE (username = $1 OR email = $1)
       LIMIT 1`,
      [usernameOrEmail]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'Неверный логин или пароль' });
    }

    const dbUser = result.rows[0];

    const isPasswordValid = await passwordsMatch(dbUser, password);

    if (!isPasswordValid) {
      return res.json({ success: false, message: 'Неверный логин или пароль' });
    }

    if (dbUser.is_banned) {
      return res.json({ success: false, message: 'Ваш аккаунт заблокирован' });
    }

    if (!dbUser.email_verified) {
      return res.json({
        success: false,
        message: 'Подтвердите email кодом из письма',
        requiresVerification: true,
        userId: String(dbUser.id),
      });
    }

    res.json({ success: true, message: 'Вход выполнен!', data: mapUserFromDb(dbUser) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Подтверждение email по коду
router.post('/verify-code', async (req, res) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.json({ success: false, message: 'Не указан ID пользователя или код' });
  }

  try {
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
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Повторная отправка кода
router.post('/resend-code', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.json({ success: false, message: 'Не указан ID пользователя' });
  }

  try {
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
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

module.exports = router;
