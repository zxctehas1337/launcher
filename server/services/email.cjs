const nodemailer = require('nodemailer');
require('dotenv').config();

// Настройка SMTP транспорта
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true для порта 465, false для других портов
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Функция генерации 6-значного кода
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Функция отправки кода подтверждения
async function sendVerificationEmail(email, username, verificationCode) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Код подтверждения',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              background-color: #000000; 
              margin: 0; padding: 24px; 
              color: #ffffff;
            }
            .container { 
              max-width: 500px; 
              margin: 0 auto; 
              background-color: #0a0a0a; 
              border: 1px solid #333333; 
              border-radius: 24px; 
              overflow: hidden;
              box-shadow: 0 4px 24px rgba(0,0,0,0.5);
            }
            .header { 
              background-color: #000000; 
              padding: 32px 24px; 
              text-align: center; 
              border-bottom: 1px solid #1a1a1a;
            }
            .logo { 
              font-size: 24px; 
              font-weight: 700; 
              color: #ff8c00; 
              letter-spacing: 2px;
              margin: 0;
              text-transform: uppercase;
            }
            .content { 
              padding: 40px 24px; 
              text-align: center; 
            }
            .title { 
              font-size: 20px; 
              font-weight: 600; 
              color: #ffffff; 
              margin: 0 0 16px 0;
            }
            .description { 
              font-size: 15px; 
              line-height: 1.6; 
              color: #888888; 
              margin: 0 0 32px 0;
            }
            .code-container { 
              background-color: rgba(255, 140, 0, 0.05); 
              border: 1px solid rgba(255, 140, 0, 0.2); 
              border-radius: 16px; 
              padding: 24px; 
              margin: 24px 0;
            }
            .code { 
              font-size: 36px; 
              font-weight: 700; 
              letter-spacing: 8px; 
              color: #ff8c00; 
              font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace; 
              margin: 0;
              text-shadow: 0 0 20px rgba(255, 140, 0, 0.3);
            }
            .expiry { 
              font-size: 13px; 
              color: #666666; 
              margin: 16px 0 0 0;
            }
            .footer { 
              padding: 24px; 
              text-align: center; 
              color: #444444; 
              font-size: 12px; 
              border-top: 1px solid #1a1a1a;
            }
            .icon { 
              width: 20px; 
              height: 20px; 
              margin-right: 8px; 
              vertical-align: middle;
              color: #ff8c00;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">INSIDE</h1>
            </div>
            <div class="content">
              <h2 class="title">Код подтверждения</h2>
              <p class="description">
                Используйте этот код для входа в аккаунт
              </p>
              <div class="code-container">
                <div class="code">${verificationCode}</div>
              </div>
              <p class="expiry">Код действителен 10 минут</p>
              
              <p class="description" style="font-size: 13px; margin-top: 32px;">
                Если вы не запрашивали код, просто проигнорируйте это письмо.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 SHAKEDOWN. Все права защищены.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Код подтверждения отправлен на ${email}`);
    console.log(`Код: ${verificationCode}`);

    return true;
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error.message);
    return false;
  }
}

module.exports = { transporter, generateVerificationCode, sendVerificationEmail };
