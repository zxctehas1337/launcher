const PRODUCTS = [
  {
    id: 'client-30',
    name: 'Клиент на 30 дней',
    price: 199,
    duration: 30,
    description: 'Доступ к клиенту на 30 дней',
    features: ['Полный функционал', 'Обновления', 'Поддержка']
  },
  {
    id: 'client-90',
    name: 'Клиент на 90 дней',
    price: 449,
    duration: 90,
    description: 'Доступ к клиенту на 90 дней',
    features: ['Полный функционал', 'Обновления', 'Поддержка'],
    popular: true
  },
  {
    id: 'client-lifetime',
    name: 'Клиент навсегда',
    price: 999,
    duration: -1,
    description: 'Пожизненный доступ к клиенту',
    features: ['Полный функционал', 'Все обновления', 'Приоритетная поддержка']
  },
  {
    id: 'hwid-reset',
    name: 'Сброс привязки',
    price: 99,
    description: 'Сброс HWID привязки',
    features: ['Мгновенный сброс', 'Новая привязка']
  }
];

module.exports = { PRODUCTS };
