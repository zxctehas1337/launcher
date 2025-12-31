const nodemailer = require('nodemailer');
require('dotenv').config();

// Настройка SMTP транспорта
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: (Number(process.env.SMTP_PORT) || 465) === 465,
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
              border: 1px solid #1a1a1a; 
              border-radius: 8px; 
              overflow: hidden;
            }
            .header { 
              background-color: #000000; 
              padding: 32px 24px; 
              text-align: center; 
              border-bottom: 1px solid #1a1a1a;
            }
            .logo { 
              font-size: 20px; 
              font-weight: 600; 
              color: #ffffff; 
              letter-spacing: 2px;
              margin: 0;
            }
            .content { 
              padding: 40px 24px; 
              text-align: center; 
            }
            .title { 
              font-size: 18px; 
              font-weight: 500; 
              color: #ffffff; 
              margin: 0 0 16px 0;
            }
            .description { 
              font-size: 15px; 
              line-height: 1.5; 
              color: #888888; 
              margin: 0 0 32px 0;
            }
            .code-container { 
              background-color: #111111; 
              border: 1px solid #2a2a2a; 
              border-radius: 6px; 
              padding: 24px; 
              margin: 24px 0;
            }
            .code { 
              font-size: 32px; 
              font-weight: 600; 
              letter-spacing: 6px; 
              color: #ffffff; 
              font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace; 
              margin: 0;
            }
            .expiry { 
              font-size: 13px; 
              color: #666666; 
              margin: 16px 0 0 0;
            }
            .footer { 
              padding: 24px; 
              text-align: center; 
              color: #666666; 
              font-size: 12px; 
              border-top: 1px solid #1a1a1a;
            }
            .icon { 
              width: 16px; 
              height: 16px; 
              margin-right: 8px; 
              vertical-align: middle;
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
                <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                Код отправлен на ${email}
              </p>
              <div class="code-container">
                <div class="code">${verificationCode}</div>
                <p class="expiry">Код действителен 10 минут</p>
              </div>
              <p class="description">
                Если вы не запрашивали код, проигнорируйте это письмо.
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
