// Скрипт для локального входа в админку через консоль браузера
// Скопируйте и вставьте этот код в консоль разработчика (Ctrl+Shift+I)
// Затем выполните: auth_test_admin()

window.auth_test_admin = async function() {
  const password = prompt('🔐 Введите пароль для входа в админку:');
  
  if (!password) {
    console.log('❌ Вход отменен');
    return;
  }
  
  if (password !== '5732') {
    console.log('❌ Неверный пароль!');
    console.log('💡 Подсказка: пароль состоит из 4 цифр');
    return;
  }
  
  console.log('✅ Пароль принят!');
  console.log('📡 Отправка запроса на сервер...');
  
  try {
    const response = await fetch('/api/auth?action=auth_test_admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('🎉 Вход в админку выполнен успешно!');
      console.log('👤 Пользователь:', result.data.username);
      console.log('📧 Email:', result.data.email);
      console.log('🔑 Права администратора:', result.data.is_admin ? 'Да' : 'Нет');
      console.log('📋 ID пользователя:', result.data.id);
      
      // Сохраняем данные в localStorage для имитации сессии
      localStorage.setItem('user', JSON.stringify(result.data));
      localStorage.setItem('token', 'test_admin_token');
      localStorage.setItem('isAdmin', 'true');
      
      console.log('💾 Данные сохранены в localStorage');
      console.log('🔄 Обновите страницу для применения изменений');
      
      // Можно автоматически обновить страницу
      if (confirm('Обновить страницу для входа в админку?')) {
        window.location.reload();
      }
    } else {
      console.log('❌ Ошибка входа:', result.message);
    }
  } catch (error) {
    console.log('❌ Ошибка соединения с сервером:', error.message);
    console.log('💡 Убедитесь что сервер запущен и вы находитесь на сайте');
  }
};

console.log('🔐 Функция auth_test_admin() добавлена в консоль');
console.log('💡 Выполните auth_test_admin() для входа в админку');
