import Footer from '../components/Footer'
import Navigation from '../components/Navigation'
import '../styles/legal/LegalPages.css'
import { getCurrentLanguage, Language } from '../utils/translations'
import { useEffect, useState } from 'react'

export default function UsageRulesPage() {
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
            <h1>Правила пользования</h1>
            <p>
              Чтобы сервис работал стабильно и безопасно, запрещены следующие действия.
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
                  Настоящие Правила использования (далее — «Правила») определяют условия эксплуатации программного обеспечения, веб-сайта, личного кабинета и сопутствующих API-сервисов (совместно именуемые — «Сервисы»), предоставляемых Администрацией проекта.
                </p>
                <p>
                  Использование любого из Сервисов означает безусловное согласие Пользователя с настоящими Правилами. В случае несогласия с какими-либо положениями настоящих Правил, Пользователь обязан незамедлительно прекратить использование Сервисов и удалить программное обеспечение со своего устройства.
                </p>
                <p>
                  Администрация оставляет за собой право в одностороннем порядке изменять содержание настоящих Правил. Новая редакция вступает в силу с момента её опубликования на текущей странице, если иное не предусмотрено самой редакцией.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">2</div>
                <h2 className="legal-section-title">Ограничения и запреты</h2>
              </div>
              <div className="legal-section-content">
                <p>Пользователю категорически запрещается совершать следующие действия, включая, но не ограничиваясь:</p>
                <ul>
                  <li>
                    <strong>Нарушение целостности инфраструктуры:</strong> осуществлять несанкционированный доступ, обход систем защиты, проведение DDoS/DoS атак, подбор паролей (brute force) или иное вмешательство в работу серверного оборудования и API.
                  </li>
                  <li>
                    <strong>Анализ и модификация кода:</strong> декомпилировать, дизассемблировать, проводить реверс-инжиниринг (обратное проектирование), извлекать алгоритмы или исходный код программных продуктов проекта.
                  </li>
                  <li>
                    <strong>Обход правовых и технических ограничений:</strong> использование эксплойтов, автоматизированных скриптов, подмена сетевых запросов или применение прокси-серверов в целях получения неправомерных преимуществ или доступа к закрытым сегментам Сервиса.
                  </li>
                  <li>
                    <strong>Конфликт интересов:</strong> использование Сервисов лицами, прямо или косвенно вовлеченными в разработку систем противодействия компьютерным атакам (античитов) или конкурирующих программных продуктов.
                  </li>
                  <li>
                    <strong>Незаконное распространение:</strong> копирование, продажа, передача в аренду, сублицензирование или распространение любых компонентов Сервиса, включая ключи доступа и файлы лаунчера.
                  </li>
                  <li>
                    <strong>Репутационный ущерб:</strong> совершение действий, направленных на дискредитацию проекта, включая распространение заведомо ложной информации, клевету или провокационное поведение в публичном поле.
                  </li>
                  <li>
                    <strong>Противоправная деятельность:</strong> использование Сервисов для целей мошенничества, фишинга, распространения вредоносного ПО или нарушения прав третьих лиц на частную жизнь.
                  </li>
                </ul>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">3</div>
                <h2 className="legal-section-title">Безопасность учетной записи</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Пользователь несет полную юридическую и техническую ответственность за сохранность своих аутентификационных данных (логин/пароль) и за все операции, произведенные с использованием его учетной записи.
                </p>
                <p>
                  При обнаружении фактов несанкционированного доступа Администрация вправе приостановить доступ к аккаунту Пользователя до завершения процедуры верификации законного владельца.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">4</div>
                <h2 className="legal-section-title">Интеллектуальная собственность</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Все исключительные права на программный код, графические интерфейсы, торговые знаки и иные объекты интеллектуальной собственности, доступные в рамках Сервиса, принадлежат правообладателю на законных основаниях.
                </p>
                <p>
                  Пользователю предоставляется ограниченная, неисключительная и отзывная лицензия исключительно в целях личного использования Сервиса согласно его функциональному назначению.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">5</div>
                <h2 className="legal-section-title">Ответственность и санкции</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  За однократное или систематическое нарушение настоящих Правил Администрация вправе применить меры технического ограничения доступа (блокировку) без предварительного уведомления и возврата денежных средств.
                </p>
                <p>
                  Сервисы предоставляются по принципу «как есть» (AS IS). Администрация не гарантирует бесперебойную работу и не несет ответственности за косвенные убытки, включая блокировки в продуктах сторонних компаний (античит-системы, игровые платформы). Использование ПО осуществляется Пользователем на свой страх и риск.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">6</div>
                <h2 className="legal-section-title">Заключительные положения</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Все споры, возникающие из настоящих Правил, подлежат разрешению путем досудебной претензионной переписки. В случае невозможности достижения согласия, спор передается на рассмотрение в компетентный суд в соответствии с законодательством по месту регистрации Администрации.
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
