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
                <h2 className="legal-section-title">Определения и термины</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  <strong>Лицензиар</strong> — правообладатель, осуществляющий управление Проектом и предоставляющий право использования программного обеспечения.
                </p>
                <p>
                  <strong>Лицензиат</strong> — физическое лицо, обладающее необходимой дееспособностью для заключения настоящего Соглашения, использующее Сервисы проекта.
                </p>
                <p>
                  <strong>Программное обеспечение (ПО)</strong> — совокупность программного кода, графических, текстовых и иных материалов, составляющих продукт Проекта.
                </p>
                <p>
                  <strong>Акцепт</strong> — полное и безоговорочное принятие условий настоящего Соглашения путем совершения конклюдентных действий (регистрация, авторизация, использование ПО).
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">2</div>
                <h2 className="legal-section-title">Предмет Соглашения</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Лицензиар предоставляет Лицензиату право использования ПО на условиях простой неисключительной лицензии в ознакомительных и развлекательных целях. Объем предоставляемых прав зависит от выбранного типа доступа (подписки).
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">3</div>
                <h2 className="legal-section-title">Порядок использования и регистрация</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Для доступа к функционалу Лицензиат создает учетную запись. Лицензиат обязуется предоставлять актуальные данные и несет ответственность за любые действия, совершенные под его учетной записью.
                </p>
                <p>
                  Запрещается передача (возмездная или безвозмездная) доступа к учетной записи третьим лицам. Лицензиат осознает, что нарушение данного условия ведет к немедленному отзыву лицензии (блокировке).
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">4</div>
                <h2 className="legal-section-title">Ограничение ответственности</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Лицензиар не несет ответственности за прямой или косвенный ущерб, возникший вследствие использования или невозможности использования ПО, включая потерю данных или блокировки в сторонних сервисах.
                </p>
                <p>
                  Лицензиар не гарантирует совместимость ПО со всем спектром технических конфигураций устройств и программного обеспечения Лицензиата.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">5</div>
                <h2 className="legal-section-title">Финансовые условия и подписки</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Предоставление расширенного доступа осуществляется на возмездной основе. Моментом исполнения обязательств Лицензиара по предоставлению права использования считается момент активации соответствующего ключа или начисления времени доступа в учетной записи.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">6</div>
                <h2 className="legal-section-title">Политика возвратов</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  В соответствии с законодательством об интеллектуальной собственности и цифровых товарах, возврат денежных средств за уже активированный доступ (начало использования лицензии) не производится.
                </p>
                <p>
                  Возврат возможен только в случае доказанной технической неработоспособности ПО по вине Лицензиара при условии, что Лицензиат обратился за поддержкой и предоставил необходимые данные для диагностики.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">7</div>
                <h2 className="legal-section-title">Срок действия и изменение условий</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Соглашение вступает в силу с момента Акцепта и действует в течение всего периода использования Сервиса. Лицензиар вправе изменять условия Соглашения в любое время без персонального уведомления.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">8</div>
                <h2 className="legal-section-title">Разрешение споров</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Стороны устанавливают обязательный претензионный порядок. Срок рассмотрения претензии — 15 (пятнадцать) рабочих дней с момента получения обращения в службу поддержки.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">9</div>
                <h2 className="legal-section-title">Юридический статус ПО</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Программное обеспечение является результатом интеллектуальной деятельности. Вне зависимости от терминологии «покупка», Лицензиату предоставляется право пользования (лицензия), а не право собственности на код или бренд.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">10</div>
                <h2 className="legal-section-title">Обратная связь</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  По любым вопросам, связанным с исполнением настоящего Соглашения, Лицензиат вправе обратиться к Лицензиару через официальные тикет-системы и каналы связи, указанные в интерфейсе Проекта.
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
