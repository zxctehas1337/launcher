// Скрипт для локального входа в админку
// Запуск: node server/scripts/auth-test-admin.js

const readline = require('readline');
const https = require('https');
const http = require('http');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Локальный вход в админку');
console.log('═════════════════════════════\n');

rl.question('Введите пароль: ', async (password) => {
  if (password === '5732') {
    console.log('\n✅ Пароль принят!');
    console.log('📡 Отправка запроса на сервер...\n');
    
    // Отправляем запрос на сервер
    const postData = JSON.stringify({ password: password });
    
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth?action=auth_test_admin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.success) {
            console.log('🎉 Вход в админку выполнен успешно!');
            console.log('👤 Пользователь:', result.data.username);
            console.log('📧 Email:', result.data.email);
            console.log('🔑 Права администратора:', result.data.is_admin ? 'Да' : 'Нет');
            console.log('\n📋 Данные для входа:');
            console.log('   Token: test_admin_token');
            console.log('   User ID:', result.data.id);
            console.log('\n💡 Используйте эти данные для входа в админ-панель');
          } else {
            console.log('❌ Ошибка входа:', result.message);
          }
        } catch (error) {
          console.log('❌ Ошибка обработки ответа:', error.message);
          console.log('📄 Ответ сервера:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Ошибка соединения с сервером:', error.message);
      console.log('💡 Убедитесь что сервер запущен на http://localhost:8080');
    });
    
    req.write(postData);
    req.end();
    
  } else {
    console.log('❌ Неверный пароль!');
    console.log('💡 Подсказка: пароль состоит из 4 цифр');
  }
  
  rl.close();
});
