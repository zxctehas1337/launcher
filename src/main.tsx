import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'
import { SpeedInsights } from '@vercel/speed-insights/react'

// Скрытая функция для локального тестирования (вызов из консоли: local_auth_test())
declare global {
  interface Window {
    local_auth_test: (username?: string, email?: string, password?: string) => Promise<void>;
  }
}

window.local_auth_test = async (
  username = 'test_user_' + Math.random().toString(36).substr(2, 5),
  email = 'test' + Math.random().toString(36).substr(2, 5) + '@local.dev'
) => {
  // Фейк данные пользователя
  const fakeUser = {
    id: Math.floor(Math.random() * 10000),
    username: username,
    email: email,
    subscription: 'free',
    registeredAt: new Date().toISOString(),
    isAdmin: false,
    isBanned: false,
    emailVerified: true,
    settings: '{}'
  };
  
  localStorage.setItem('currentUser', JSON.stringify(fakeUser));
  console.log('✅ Фейк вход выполнен!', fakeUser);
  console.log('Перезагрузите страницу или перейдите на /dashboard');
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <SpeedInsights />
  </React.StrictMode>,
)
