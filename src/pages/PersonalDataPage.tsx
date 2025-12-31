import Footer from '../components/Footer'
import Navigation from '../components/Navigation'
import '../styles/legal/LegalPages.css'
import { getCurrentLanguage, Language } from '../utils/translations'
import { useEffect, useState } from 'react'

export default function PersonalDataPage() {
  const [lang, setLang] = useState<Language>(getCurrentLanguage())

  useEffect(() => {
    const handleStorageChange = () => {
      setLang(getCurrentLanguage())
    }
    window.addEventListener('storage', handleStorageChange)

    const interval = setInterval(() => {
      const newLang = getCurrentLanguage()
      if (newLang !== lang) {
        setLang(newLang)
      }
    }, 100)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [lang])

  const handleLanguageChange = () => {
    setLang(getCurrentLanguage())
  }

  return (
    <div className="legal-page">
      <Navigation onLanguageChange={handleLanguageChange} />
      <section className="features-section" style={{ paddingTop: '120px' }}>
        <div className="container">
          <div className="legal-intro">
            <h1>Обработка персональных данных</h1>
            <p>
              Мы берём и обрабатываем только те данные, которые необходимы для работы аккаунта, оплаты и поддержки.
            </p>
          </div>

          <div className="legal-content">
            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">1</div>
                <h2 className="legal-section-title">Общие положения</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Настоящий документ описывает, какие данные мы можем получать при использовании сайта, личного кабинета,
                  лаунчера и связанных сервисов, а также для каких целей и на каких условиях они используются.
                </p>
                <p>
                  Используя сервисы проекта и/или создавая аккаунт, вы соглашаетесь с условиями обработки данных,
                  описанными на этой странице.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">2</div>
                <h2 className="legal-section-title">Какие данные можем получать</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Логин, e-mail, идентификатор пользователя (UID), служебные данные авторизации, а также технические данные,
                  необходимые для защиты аккаунта и привязки устройства (например, HWID), если это используется лаунчером.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">3</div>
                <h2 className="legal-section-title">Технические данные и cookies</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Мы можем обрабатывать техническую информацию, которая автоматически передается браузером/устройством:
                  IP-адрес, тип устройства и браузера, язык интерфейса, дату и время запросов, страницы/действия в сервисе,
                  а также диагностические события (логи) для защиты и отладки.
                </p>
                <p>
                  Сервис может использовать cookies и аналогичные технологии для авторизации, сохранения настроек и
                  обеспечения безопасности. Вы можете ограничить cookies в настройках браузера, однако часть функций может
                  работать некорректно.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">4</div>
                <h2 className="legal-section-title">Зачем это нужно</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Для создания и поддержки аккаунта, предоставления доступа к продуктам, обработки платежей, предотвращения
                  мошенничества и обеспечения безопасности.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">5</div>
                <h2 className="legal-section-title">Правовые основания</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Мы обрабатываем данные на основании вашего согласия (например, при регистрации), необходимости исполнения
                  договора/оказания услуг (предоставление доступа к продуктам), а также законных интересов (безопасность,
                  предотвращение злоупотреблений и мошенничества).
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">6</div>
                <h2 className="legal-section-title">Передача третьим лицам</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Мы не продаём персональные данные третьим лицам. Доступ к данным может предоставляться ограниченному кругу
                  подрядчиков только в объеме, необходимом для работы сервиса, например:
                </p>
                <ul>
                  <li>платежным провайдерам — для обработки оплаты и подтверждения транзакций;</li>
                  <li>почтовым сервисам — для отправки писем (коды подтверждения, уведомления поддержки);</li>
                  <li>хостинг/инфраструктура — для хранения и передачи данных в рамках работы сайта и API.</li>
                </ul>
                <p>
                  Мы можем раскрыть данные, если этого требует закон или запрос уполномоченного органа при наличии
                  законных оснований.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">7</div>
                <h2 className="legal-section-title">Как мы используем и храним данные</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Данные используются строго в рамках работы сервиса. Мы применяем меры защиты и не продаём персональные
                  данные третьим лицам.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">8</div>
                <h2 className="legal-section-title">Сроки хранения</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Мы храним данные не дольше, чем это необходимо для целей обработки: поддержания аккаунта, оказания услуг,
                  соблюдения требований безопасности и/или выполнения юридических обязательств. Срок хранения может быть
                  продлен, если это требуется по закону или для защиты прав и интересов проекта.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">9</div>
                <h2 className="legal-section-title">Безопасность</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Мы применяем организационные и технические меры защиты, направленные на предотвращение несанкционированного
                  доступа, изменения, раскрытия или уничтожения данных. Однако вы также обязаны соблюдать меры безопасности:
                  использовать сложный пароль и не передавать учетные данные третьим лицам.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">10</div>
                <h2 className="legal-section-title">Права пользователя</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Вы можете запросить уточнение/обновление данных, ограничение обработки или удаление аккаунта, если это не
                  противоречит требованиям закона и целям безопасности. По вопросам доступа, исправления или удаления данных
                  обратитесь в поддержку.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">11</div>
                <h2 className="legal-section-title">Связь</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  По вопросам обработки персональных данных вы можете обратиться в поддержку проекта.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer lang={lang} />
    </div>
  )
}
