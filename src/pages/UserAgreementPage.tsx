import Footer from '../components/Footer'
import Navigation from '../components/Navigation'
import '../styles/legal/LegalPages.css'
import { getCurrentLanguage, Language } from '../utils/translations'
import { useEffect, useState } from 'react'

export default function UserAgreementPage() {
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
            <h1>Пользовательское соглашение</h1>
            <p>
              Используя сайт и сервисы проекта, вы соглашаетесь с условиями ниже.
            </p>
          </div>

          <div className="legal-content">
            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">1</div>
                <h2 className="legal-section-title">Термины</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  «Проект/Сервис» — сайт, личный кабинет, лаунчер, API и связанные с ними сервисы. «Пользователь» — лицо,
                  использующее сервисы проекта. «Продукт» — цифровой функционал/подписка, предоставляемые в рамках проекта.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">2</div>
                <h2 className="legal-section-title">Предмет соглашения</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Мы предоставляем доступ к функционалу сайта/личного кабинета, покупке подписок и получению обновлений.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">3</div>
                <h2 className="legal-section-title">Регистрация и использование</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Для использования части функционала требуется аккаунт. Вы обязуетесь указывать достоверные данные при
                  регистрации и поддерживать их актуальность.
                </p>
                <p>
                  Вы несёте ответственность за сохранность учетных данных и за действия, совершенные под вашим аккаунтом.
                  Передача аккаунта и совместное использование доступа третьими лицами запрещены.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">4</div>
                <h2 className="legal-section-title">Ответственность</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Вы используете сервис на свой риск. Мы не несем ответственности за ограничения со стороны сторонних
                  платформ/серверов.
                </p>
                <p>
                  Мы не гарантируем, что сервис будет работать без ошибок и перерывов, однако прикладываем разумные усилия
                  для поддержания стабильности и безопасности.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">5</div>
                <h2 className="legal-section-title">Оплата и доступ</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Оплата открывает доступ к выбранному продукту на указанный срок. Возвраты/отмена — в рамках политики
                  проекта.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">6</div>
                <h2 className="legal-section-title">Возвраты и отмена</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Поскольку предоставляются цифровые услуги/доступ к цифровому продукту, возврат может быть ограничен после
                  начала предоставления доступа (активации подписки/выдачи ключа/открытия функционала). В спорных случаях
                  решение принимается индивидуально поддержкой, с учетом фактического использования продукта и признаков
                  злоупотреблений.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">7</div>
                <h2 className="legal-section-title">Изменение условий</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Мы можем изменять условия настоящего соглашения и связанные документы (правила, политика обработки данных).
                  Актуальная версия публикуется на сайте и вступает в силу с момента публикации.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">8</div>
                <h2 className="legal-section-title">Урегулирование споров</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  По вопросам работы сервиса и платежей сначала обратитесь в поддержку. Мы постараемся урегулировать спор в
                  досудебном порядке. При невозможности урегулирования спор рассматривается в порядке, установленном
                  применимым законодательством.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">9</div>
                <h2 className="legal-section-title">Принятие условий</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Продолжая пользоваться сервисом, вы подтверждаете, что ознакомились с правилами и принимаете их.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">10</div>
                <h2 className="legal-section-title">Контакты</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  По вопросам соглашения, оплаты и доступа обращайтесь в поддержку через официальные каналы проекта,
                  указанные на сайте.
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
