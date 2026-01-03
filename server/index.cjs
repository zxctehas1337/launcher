const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Config
const { pool, initDatabase } = require('./database.cjs');

// Routes
const authRoutes = require('./routes/auth.cjs');
const usersRoutes = require('./routes/users.cjs');
const productsRoutes = require('./routes/products.cjs');
const hwidRoutes = require('./routes/hwid.cjs');
const keysRoutes = require('./routes/keys.cjs');
const versionsRoutes = require('./routes/versions.cjs');
const clientRoutes = require('./routes/client.cjs');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
    });
    next();
  });
}
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://booleanclient.ru',
  credentials: true
}));
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Инициализация БД
initDatabase();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/hwid', hwidRoutes);
app.use('/api/keys', keysRoutes);
app.use('/api/versions', versionsRoutes);
app.use('/api/client', clientRoutes);

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                  🚀 INSIDE Server v3.0.0                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`📧 Google SMTP: ${process.env.SMTP_USER || 'Не настроен'}`);
  console.log(`🗄️  База данных: Подключена\n`);
  console.log('📝 Доступные эндпоинты:');
  console.log('   POST /api/auth/register - Регистрация с отправкой кода');
  console.log('   POST /api/auth/login - Вход');
  console.log('   POST /api/auth/verify-code - Подтверждение кода');
  console.log('   POST /api/auth/resend-code - Повторная отправка кода');
  console.log('   GET  /api/users - Список пользователей');
  console.log('   GET  /api/users/:id - Информация о пользователе');
  console.log('   GET  /api/hwid/:userId - Получить HWID пользователя');
  console.log('   POST /api/hwid/set - Установить HWID');
  console.log('   POST /api/hwid/reset - Сбросить HWID');
  console.log('   POST /api/hwid/verify - Проверить HWID');
  console.log('   GET  /api/products - Список продуктов и цен');
  console.log('   GET  /api/products/:id - Информация о продукте\n');
  console.log('🧪 Тестирование:');
  console.log('   npm run test:email - Проверка отправки email');
  console.log('   npm run test:registration - Тест регистрации\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
});
