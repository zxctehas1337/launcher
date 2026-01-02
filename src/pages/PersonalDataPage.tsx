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
                  Настоящая Политика конфиденциальности (далее — «Политика») разработана в соответствии с требованиями Федерального закона № 152-ФЗ «О персональных данных» (РФ) и Общего регламента по защите данных (GDPR, ЕС).
                </p>
                <p>
                  Политика определяет порядок обработки персональных данных и меры по обеспечению безопасности информации Пользователей, которую Администрация проекта может получить во время использования Сервисов.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">2</div>
                <h2 className="legal-section-title">Состав обрабатываемой информации</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Администрация может обрабатывать следующие данные: электронная почта, идентификаторы устройств (HWID), IP-адреса, данные о транзакциях (без хранения реквизитов карт), логи доступа и иную техническую информацию, необходимую для функционирования ПО и защиты от мошенничества.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">3</div>
                <h2 className="legal-section-title">Цели обработки данных</h2>
              </div>
              <div className="legal-section-content">
                <p>Персональные данные обрабатываются исключительно в целях:</p>
                <ul>
                  <li>Предоставления доступа к функционалу Личного кабинета и ПО;</li>
                  <li>Обеспечения информационной безопасности и предотвращения взломов;</li>
                  <li>Технической поддержки и обработки обращений;</li>
                  <li>Выполнения обязательств в рамках Лицензионного соглашения.</li>
                </ul>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">4</div>
                <h2 className="legal-section-title">Правовые основания</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Основанием для обработки данных является согласие Пользователя, выраженное в форме Акцепта Лицензионного соглашения, а также необходимость исполнения договора (предоставление лицензии).
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">5</div>
                <h2 className="legal-section-title">Безопасность и хранение</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Мы применяем современные методы шифрования и организационные меры защиты данных. Информация хранится на защищенных серверах и не подлежит передаче третьим лицам за исключением случаев, предусмотренных законом или необходимых для работы платежных шлюзов.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">6</div>
                <h2 className="legal-section-title">Использование Cookies</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Сервис использует файлы cookie для сохранения сессий авторизации и анализа предпочтений. Использование Сервиса означает согласие на работу с данными технологиями.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">7</div>
                <h2 className="legal-section-title">Права Пользователя</h2>
              </div>
              <div className="legal-section-content">
                <p>Пользователь имеет право на:</p>
                <ul>
                  <li>Получение информации об объемах и способах обработки его данных;</li>
                  <li>Уточнение, блокирование или уничтожение неполных, неточных или незаконно полученных данных;</li>
                  <li>Отзыв согласия на обработку персональных данных (путем запроса на удаление аккаунта).</li>
                </ul>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">8</div>
                <h2 className="legal-section-title">Трансграничная передача</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Пользователь осознает и соглашается, что в процессе работы Сервиса данные могут передаваться на сервера, расположенные в различных юрисдикциях (включая страны ЕС и РФ) для обеспечения отказоустойчивости и скорости доступа.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">9</div>
                <h2 className="legal-section-title">Изменение Политики</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Администрация вправе изменять Политику конфиденциальности. Новая редакция вступает в силу с момента размещения на сайте. Пользователь обязуется самостоятельно отслеживать изменения.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">10</div>
                <h2 className="legal-section-title">Контакты по вопросам данных</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Запросы на предоставление информации об обработке или на удаление данных принимаются через официальные каналы поддержки Проекта.
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
