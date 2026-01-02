import { useNavigate } from 'react-router-dom'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { IconArrowRight, IconBolt } from './Icons'
import PixelBackground from './PixelBackground'
import { getTranslation } from '../utils/translations'
import type { Language } from '../utils/translations'

interface HeroSectionProps {
  lang?: Language
}

export default function HeroSection({ lang }: HeroSectionProps) {
  const navigate = useNavigate()
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1, rootMargin: '0px 0px -50px 0px' })
  
  const translation = getTranslation(lang || 'ru')

  return (
    <main
      ref={ref}
      data-animate="hero"
      className={`hero-section ${isVisible ? 'visible' : ''}`}
    >
      <div className="hero-wrapper">
        <PixelBackground />
        <div className={`hero-content ${isVisible ? 'animate-in' : ''}`}>
          
          <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: translation.hero.title }} />

          <p className="hero-subtitle animate-item delay-3">
            {translation.hero.subtitle}
          </p>

          <div className="hero-buttons animate-item delay-4">
            <button onClick={() => navigate('/login')} className="primary-button-orange">
              <IconBolt size={20} className="button-icon-svg" />
              <span>{translation.hero.cta}</span>
              <IconArrowRight />
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
