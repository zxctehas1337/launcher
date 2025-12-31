 // Константы приложения

// Информация о клиенте
export const CLIENT_INFO = {
  name: 'SHAKEDOWN',
  version: '1.21.4',
  minecraftVersion: '1.21.4',
  platform: 'Windows 10/11'
}

// Ссылки на скачивание лаунчера
export const DOWNLOAD_LINKS = {
  launcher: 'https://www.dropbox.com/scl/fi/kba2qnxug1lr7r0893y6t/ShakeDown-Launcher_0.1.0_x64-setup.exe?rlkey=e84vj49yiiosi76w5dn7eldus&st=le42exs4&dl=1',
}

// Социальные сети (заполнишь позже)
export const SOCIAL_LINKS = {
  discord: '', // Заполнить позже
  telegram: '', // Заполнить позже
  youtube: '',
  vk: ''
}

// Тип продукта
export interface Product {
  id: string
  name: string
  price: number
  duration?: number
  description: string
  features: string[]
  popular?: boolean
  discount?: number
  originalPrice?: number
}

// API URL - теперь относительный, так как фронт и бэк на одном домене (Vercel)
const API_URL = ''

// Функция загрузки продуктов с сервера
export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}/api/products`)
    const data = await response.json()
    if (data.success) {
      return data.data
    }
    console.error('Ошибка загрузки продуктов:', data.message)
    return []
  } catch (error) {
    console.error('Ошибка загрузки продуктов:', error)
    return []
  }
}

// Функция получения одного продукта
export async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_URL}/api/products/${id}`)
    const data = await response.json()
    if (data.success) {
      return data.data
    }
    return null
  } catch (error) {
    console.error('Ошибка загрузки продукта:', error)
    return null
  }
}

// Fallback продукты (на случай если API недоступен)
export const PRODUCTS_FALLBACK: Product[] = [
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
  },
  {
    id: 'alpha',
    name: 'ALPHA 1.16.5',
    price: 599,
    duration: -1,
    description: 'Клиент для версии 1.16.5',
    features: ['Уникальные функции', 'Обновления', 'Поддержка']
  },
  {
    id: 'premium-30',
    name: 'Premium 30D',
    price: 299,
    duration: 30,
    description: 'Premium статус на 30 дней',
    features: ['Эксклюзивные функции', 'Приоритет в очереди', 'Приоритетная поддержка']
  }
]

// Для обратной совместимости - экспортируем fallback как PRODUCTS
export const PRODUCTS = PRODUCTS_FALLBACK

// Способы оплаты
export const PAYMENT_METHODS = {
  youkassa: {
    name: 'ЮKassa',
    enabled: true,
    currencies: ['RUB']
  },
  funpay: {
    name: 'FunPay',
    enabled: true,
    url: '' // Заполнить позже
  }
}

// Доступные языки
export const LANGUAGES = {
  ru: { name: 'Русский', flag: '🇷🇺' },
  en: { name: 'English', flag: '🇬🇧' },
  uk: { name: 'Українська', flag: '🇺🇦' },
  pl: { name: 'Polski', flag: '🇵🇱' },
  tr: { name: 'Türkçe', flag: '🇹🇷' },
  kz: { name: 'Қазақша', flag: '🇰🇿' }
}

// Доступные темы
export const THEMES = {
  dark: { name: 'Тёмная', icon: '🌙' },
  light: { name: 'Светлая', icon: '☀️' }
}

// Видео-обзор
export const MEDIA = {
  videoPreview: 'https://www.youtube.com/embed/YOUR_VIDEO_ID', // Замените на ваше видео
  videoThumbnail: '/video-thumbnail.jpg' // Или используйте скриншот
}
