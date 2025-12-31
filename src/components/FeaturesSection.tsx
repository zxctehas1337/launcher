import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { getTranslation, Language } from '../utils/translations'
import { IconToaster, IconDesktopDream, IconSliders, IconRefresh, IconSupport, IconChecklist, IconCommunity, IconLock } from './Icons'

interface FeaturesSectionProps {
  lang: Language
}

export default function FeaturesSection({ lang }: FeaturesSectionProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1, rootMargin: '0px 0px -50px 0px' })
  const t = getTranslation(lang)

  const features = [
    { icon: <IconToaster />, title: t.features.optimization, desc: t.features.optimizationDesc },
    { icon: <IconDesktopDream />, title: t.features.interface, desc: t.features.interfaceDescFull },
    { icon: <IconSliders />, title: t.features.customization, desc: t.features.customizationDesc },
    { icon: <IconRefresh />, title: t.features.updates, desc: t.features.updatesDescFull },
    { icon: <IconSupport />, title: t.features.support, desc: t.features.supportDescFull },
    { icon: <IconChecklist />, title: t.features.richFunctionality, desc: t.features.richFunctionalityDesc },
    { icon: <IconLock />, title: t.features.security, desc: t.features.securityDesc, isSpecial: true },
    { icon: <IconCommunity />, title: t.features.community, desc: t.features.communityDesc }
  ]

  return (
    <section
      id="features"
      ref={ref}
      data-animate="features"
      className={`features-section ${isVisible ? 'visible' : ''}`}
    >
      <div className="features-container">
        <div className={`features-header animate-fade-up ${isVisible ? 'visible' : ''}`}>
          <h2 className="features-title">{t.features.ourAdvantages}</h2>
          <p className="features-subtitle">{t.features.ourAdvantagesDesc}</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`feature-card animate-fade-up ${isVisible ? 'visible' : ''} ${feature.isSpecial ? 'feature-card-security' : ''}`}
              style={{ transitionDelay: `${0.1 * (index + 1)}s` }}
            >
              <div className="feature-card-header">
                <span className="feature-card-icon">{feature.icon}</span>
                <h4 className="feature-card-title">{feature.title}</h4>
              </div>
              <p className="feature-card-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
