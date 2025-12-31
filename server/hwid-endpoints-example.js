// HWID Endpoints - Добавить в server/index.js

// ============================================
// HWID MANAGEMENT ENDPOINTS
// ============================================

// 1. Получить HWID пользователя
app.get('/api/users/:id/hwid', async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query(
      'SELECT hwid, hwid_linked_at FROM users WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'Пользователь не найден' })
    }

    const user = result.rows[0]

    res.json({
      success: true,
      data: {
        hwid: user.hwid,
        linkedAt: user.hwid_linked_at
      }
    })
  } catch (error) {
    console.error('Get HWID error:', error)
    res.status(500).json({ success: false, message: 'Ошибка сервера' })
  }
})

// 2. Привязать HWID (от лаунчера)
app.post('/api/users/:id/hwid', async (req, res) => {
  const { id } = req.params
  const { hwid } = req.body

  if (!hwid) {
    return res.json({ success: false, message: 'HWID не указан' })
  }

  try {
    // Проверяем, не привязан ли уже этот HWID к другому пользователю
    const existingHwid = await pool.query(
      'SELECT id, username FROM users WHERE hwid = $1 AND id != $2',
      [hwid, id]
    )

    if (existingHwid.rows.length > 0) {
      return res.json({
        success: false,
        message: 'Этот HWID уже привязан к другому аккаунту'
      })
    }

    // Проверяем, есть ли уже HWID у этого пользователя
    const userCheck = await pool.query(
      'SELECT hwid FROM users WHERE id = $1',
      [id]
    )

    if (userCheck.rows.length === 0) {
      return res.json({ success: false, message: 'Пользователь не найден' })
    }

    if (userCheck.rows[0].hwid) {
      return res.json({
        success: false,
        message: 'HWID уже привязан. Для смены купите сброс привязки.'
      })
    }

    // Привязываем HWID
    await pool.query(
      'UPDATE users SET hwid = $1, hwid_linked_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hwid, id]
    )

    res.json({
      success: true,
      message: 'HWID успешно привязан'
    })
  } catch (error) {
    console.error('Link HWID error:', error)
    res.status(500).json({ success: false, message: 'Ошибка сервера' })
  }
})

// 3. Сбросить HWID (платная услуга)
app.delete('/api/users/:id/hwid', async (req, res) => {
  const { id } = req.params
  const { paymentConfirmed } = req.body

  if (!paymentConfirmed) {
    return res.json({
      success: false,
      message: 'Требуется подтверждение оплаты'
    })
  }

  try {
    const result = await pool.query(
      'UPDATE users SET hwid = NULL, hwid_linked_at = NULL WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'Пользователь не найден' })
    }

    res.json({
      success: true,
      message: 'HWID успешно сброшен'
    })
  } catch (error) {
    console.error('Reset HWID error:', error)
    res.status(500).json({ success: false, message: 'Ошибка сервера' })
  }
})

// 4. Проверить HWID (от лаунчера при запуске)
app.post('/api/hwid/verify', async (req, res) => {
  const { userId, hwid } = req.body

  if (!userId || !hwid) {
    return res.json({
      success: false,
      message: 'Не указан userId или HWID'
    })
  }

  try {
    const result = await pool.query(
      `SELECT id, username, hwid, subscription, subscription_expires_at, is_banned 
       FROM users WHERE id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        valid: false,
        message: 'Пользователь не найден'
      })
    }

    const user = result.rows[0]

    // Проверка бана
    if (user.is_banned) {
      return res.json({
        success: false,
        valid: false,
        message: 'Аккаунт заблокирован'
      })
    }

    // Проверка HWID
    if (!user.hwid) {
      // HWID еще не привязан - разрешаем привязку
      return res.json({
        success: true,
        valid: true,
        needsBinding: true,
        subscription: user.subscription,
        message: 'Требуется привязка HWID'
      })
    }

    if (user.hwid !== hwid) {
      return res.json({
        success: false,
        valid: false,
        message: 'HWID не совпадает. Купите сброс привязки.'
      })
    }

    // Проверка подписки
    const now = new Date()
    const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null

    if (expiresAt && expiresAt < now) {
      return res.json({
        success: true,
        valid: false,
        expired: true,
        subscription: user.subscription,
        expiresAt: expiresAt.toISOString(),
        message: 'Подписка истекла'
      })
    }

    // Все проверки пройдены
    res.json({
      success: true,
      valid: true,
      subscription: user.subscription,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      message: 'HWID подтвержден'
    })
  } catch (error) {
    console.error('Verify HWID error:', error)
    res.status(500).json({ success: false, message: 'Ошибка сервера' })
  }
})

// ============================================
// PAYMENT WEBHOOKS (для автоматической активации)
// ============================================

// Webhook от ЮKassa
app.post('/api/webhooks/youkassa', async (req, res) => {
  const { event, object } = req.body

  // Проверка подписи (важно для безопасности!)
  // const signature = req.headers['x-yookassa-signature']
  // if (!verifyYookassaSignature(req.body, signature)) {
  //   return res.status(403).json({ error: 'Invalid signature' })
  // }

  if (event === 'payment.succeeded') {
    const { metadata, amount } = object
    const { userId, productId } = metadata

    try {
      // Активируем подписку
      const product = getProductById(productId) // Функция для получения товара

      if (product.duration) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + product.duration)

        await pool.query(
          `UPDATE users 
           SET subscription = $1, subscription_expires_at = $2 
           WHERE id = $3`,
          [product.subscription || 'premium', expiresAt, userId]
        )
      } else if (product.id === 'hwid-reset') {
        // Сброс HWID
        await pool.query(
          'UPDATE users SET hwid = NULL, hwid_linked_at = NULL WHERE id = $1',
          [userId]
        )
      }

      // Логируем транзакцию
      await pool.query(
        `INSERT INTO transactions (user_id, product_id, amount, status, payment_method, created_at)
         VALUES ($1, $2, $3, 'completed', 'youkassa', CURRENT_TIMESTAMP)`,
        [userId, productId, amount.value]
      )

      res.json({ success: true })
    } catch (error) {
      console.error('Webhook error:', error)
      res.status(500).json({ error: 'Internal error' })
    }
  } else {
    res.json({ success: true })
  }
})

// ============================================
// HELPER FUNCTIONS
// ============================================

function getProductById(productId) {
  const products = {
    'client-30': { duration: 30, subscription: 'premium' },
    'client-90': { duration: 90, subscription: 'premium' },
    'client-lifetime': { duration: -1, subscription: 'premium' },
    'hwid-reset': { id: 'hwid-reset' },
    'premium-30': { duration: 30, subscription: 'premium' },
    'alpha': { duration: -1, subscription: 'alpha' }
  }
  return products[productId] || {}
}

// ============================================
// DATABASE MIGRATION
// ============================================

// Добавить эти колонки в таблицу users:
/*
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS hwid VARCHAR(255),
ADD COLUMN IF NOT EXISTS hwid_linked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Создать таблицу транзакций
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_id VARCHAR(50),
  amount DECIMAL(10, 2),
  status VARCHAR(20),
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/
