import { PRODUCTS } from './_lib/products.js';

export default (req, res) => {
  const { id } = req.query;

  if (id) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) {
      return res.json({ success: false, message: 'Продукт не найден' });
    }
    return res.json({ success: true, data: product });
  }

  res.json({ success: true, data: PRODUCTS });
};
