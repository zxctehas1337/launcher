const express = require('express');
const router = express.Router();
const { PRODUCTS } = require('../data/products.js');

// Получить все продукты
router.get('/', (req, res) => {
  res.json({ success: true, data: PRODUCTS });
});

// Получить конкретный продукт по ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const product = PRODUCTS.find(p => p.id === id);
  
  if (!product) {
    return res.json({ success: false, message: 'Продукт не найден' });
  }
  
  res.json({ success: true, data: product });
});

module.exports = router;
