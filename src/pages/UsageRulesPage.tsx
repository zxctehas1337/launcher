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
                  Настоящие правила действуют для сайта, личного кабинета, лаунчера и всех связанных сервисов проекта.
                  Используя сервисы проекта, вы подтверждаете, что ознакомились с правилами и обязуетесь их соблюдать.
                </p>
                <p>
                  Мы можем обновлять правила. Актуальная версия публикуется на этой странице и применяется с момента
                  размещения.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">2</div>
                <h2 className="legal-section-title">Запрещено</h2>
              </div>
              <div className="legal-section-content">
                <p>Ниже перечислены типовые нарушения (перечень не является исчерпывающим):</p>
                <ul>
                  <li>
                    Вмешиваться в работу сервисов: взламывать, обходить защиту, подбирать пароли, атаковать инфраструктуру
                    (включая DDoS/DoS), мешать работе сайта, API, личного кабинета или лаунчера.
                  </li>
                  <li>
                    Декомпилировать, дизассемблировать, проводить реверс-инжиниринг, отлаживать, модифицировать, патчить или
                    иным образом пытаться извлечь исходный код/алгоритмы продукта и/или его компонентов.
                  </li>
                  <li>
                    Использовать эксплойты, уязвимости, автокликеры, подмену запросов, прокси/скрипты и иные средства,
                    направленные на получение несанкционированного доступа, обход ограничений или получение преимуществ.
                  </li>
                  <li>
                    Использовать продукты, если вы (прямо или косвенно) связаны с разработкой античитов, клиентов,
                    чит-клиентов, либо передаёте третьим лицам данные/сведения для создания таких решений.
                  </li>
                  <li>
                    Распространять, копировать, передавать, продавать, сдавать в аренду, сублицензировать, декомпилировать,
                    модифицировать, адаптировать, переводить, создавать производные работы на основе продукта или его частей.
                  </li>
                  <li>
                    Распространять файлы лаунчера, сайта, клиента или их модифицированные версии, а также ключи,
                    конфиденциальные данные доступа или иные материалы, полученные в рамках использования сервиса.
                  </li>
                  <li>
                    Совершать действия, направленные на подрыв репутации проекта и качество продукции: массовые вбросы,
                    клевета, умышленное распространение недостоверной информации, провокации.
                  </li>
                  <li>
                    Заниматься вредоносной деятельностью, включая мошенничество, обман, фишинг, распространение вредоносного
                    ПО, раскрытие личной/частной информации других лиц без их согласия.
                  </li>
                </ul>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">3</div>
                <h2 className="legal-section-title">Аккаунт и доступ</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Вы несете ответственность за сохранность данных входа и за все действия, совершенные под вашим аккаунтом.
                  Не передавайте доступ третьим лицам.
                </p>
                <p>
                  При выявлении подозрительной активности мы можем запросить подтверждение владения аккаунтом или временно
                  ограничить доступ до выяснения обстоятельств.
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
                  Продукт, сайт, личный кабинет и лаунчер (включая код, дизайн, тексты, графику и прочие материалы) являются
                  объектами авторских прав и/или иных прав правообладателя. Вам предоставляется ограниченная, отзывная,
                  неисключительная лицензия на использование продукта в пределах приобретенного доступа.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">5</div>
                <h2 className="legal-section-title">Последствия</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  При нарушении правил доступ к сервису может быть ограничен (полностью или частично), а аккаунт
                  заблокирован. В зависимости от характера нарушения меры могут применяться без предварительного
                  уведомления.
                </p>
                <p>
                  Администрация имеет право приостановить действие всех ваших существующих и будущих учетных записей на
                  данном веб-сайте в случае нарушения данных правил или в других случаях по своему усмотрению.
                </p>
                <p>
                  Администрация не несет ответственности за внутриигровые блокировки/ограничения со стороны сторонних
                  платформ, серверов и античит-систем. Продукты используются на ваш страх и риск.
                </p>
              </div>
            </div>

            <div className="legal-section">
              <div className="legal-section-header">
                <div className="legal-section-number">6</div>
                <h2 className="legal-section-title">Сообщения о нарушениях</h2>
              </div>
              <div className="legal-section-content">
                <p>
                  Если вы обнаружили уязвимость или нарушение правил, сообщите об этом через официальные каналы проекта,
                  указанные на сайте. Не публикуйте сведения об уязвимостях публично и не используйте их для получения
                  преимуществ.
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
