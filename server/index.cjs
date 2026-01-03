const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
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
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'https://booleanclient.ru', 'http://localhost:5173'],
    credentials: true
  }
});

// Store online users: { odId: socketId }
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  // User joins with their ID
  socket.on('user:online', (userId) => {
    const odIdStr = String(userId);
    onlineUsers.set(odIdStr, socket.id);
    // Update last_active in DB
    pool.query('UPDATE users SET last_active = NOW() WHERE id = $1', [userId]).catch(() => {});
    // Broadcast online status to friends
    io.emit('user:status', { userId: Number(userId), online: true });
    console.log(`[Socket] User ${userId} is online`);
  });

  // Send message
  socket.on('message:send', async (data) => {
    const { senderId, receiverId, content } = data;
    
    try {
      // Check friendship
      const friendCheck = await pool.query(`
        SELECT * FROM friendships 
        WHERE status = 'accepted' 
        AND ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
      `, [senderId, receiverId]);

      if (friendCheck.rows.length === 0) {
        socket.emit('message:error', { error: 'Not friends' });
        return;
      }

      // Save to DB
      const result = await pool.query(`
        INSERT INTO messages (sender_id, receiver_id, content)
        VALUES ($1, $2, $3)
        RETURNING id, sender_id, receiver_id, content, is_read, created_at
      `, [senderId, receiverId, content.trim()]);

      const message = result.rows[0];

      // Get sender info
      const senderInfo = await pool.query('SELECT username, avatar FROM users WHERE id = $1', [senderId]);
      message.sender_username = senderInfo.rows[0]?.username;
      message.sender_avatar = senderInfo.rows[0]?.avatar;

      // Send to sender
      socket.emit('message:new', message);

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:new', message);
      }
    } catch (error) {
      console.error('[Socket] Message error:', error);
      socket.emit('message:error', { error: 'Failed to send' });
    }
  });

  // Mark messages as read
  socket.on('message:read', async (data) => {
    const { userId, friendId } = data;
    try {
      await pool.query(`
        UPDATE messages SET is_read = true 
        WHERE sender_id = $2 AND receiver_id = $1 AND is_read = false
      `, [userId, friendId]);
      
      // Notify sender that messages were read
      const senderSocketId = onlineUsers.get(String(friendId));
      if (senderSocketId) {
        io.to(senderSocketId).emit('message:read', { userId, friendId });
      }
    } catch (error) {
      console.error('[Socket] Read error:', error);
    }
  });

  // Typing indicator
  socket.on('typing:start', (data) => {
    const receiverSocketId = onlineUsers.get(String(data.receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:start', { userId: data.senderId });
    }
  });

  socket.on('typing:stop', (data) => {
    const receiverSocketId = onlineUsers.get(String(data.receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:stop', { userId: data.senderId });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    // Find and remove user
    for (const [odIdStr, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(odIdStr);
        io.emit('user:status', { userId: Number(odIdStr), online: false });
        console.log(`[Socket] User ${odIdStr} disconnected`);
        break;
      }
    }
  });
});

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

server.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                  🚀 INSIDE Server v3.0.0                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`🔌 WebSocket: Включен`);
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
  console.log('🔌 WebSocket события:');
  console.log('   user:online - Пользователь онлайн');
  console.log('   message:send - Отправка сообщения');
  console.log('   message:new - Новое сообщение');
  console.log('   message:read - Прочитано');
  console.log('   typing:start/stop - Индикатор печати\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
});
