import { Link } from 'react-router-dom'
import { CLIENT_INFO, SOCIAL_LINKS } from '../utils/constants'
import { getTranslation, Language } from '../utils/translations'
import LogoWithHat from './LogoWithHat'

interface FooterProps {
  lang: Language
}

export default function Footer({ lang }: FooterProps) {
  const t = getTranslation(lang)

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links-section">
          <div className="footer-logo-top">
            <LogoWithHat
              alt="Shakedown"
              size={45}
              className="footer-logo-top no-user-drag"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
            <span className="footer-name-top gradient-text">{CLIENT_INFO.name}</span>
          </div>
          <div className="footer-links">
            <Link to="/pricing">{t.nav.services}</Link>
            <Link to="/login">{t.nav.dashboard}</Link>
          </div>
        </div>
        <div className="footer-social">
          {SOCIAL_LINKS.discord && (
            <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer">Discord</a>
          )}
          {SOCIAL_LINKS.telegram && (
            <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer">Telegram</a>
          )}
        </div>
        <div className="footer-legal">
          <h3 className="legal-title">Navigation</h3>
          <div className="legal-links">
            <Link to="/personal-data">{t.footer.personalData}</Link>
            <Link to="/user-agreement">{t.footer.userAgreement}</Link>
            <Link to="/usage-rules">{t.footer.usageRules}</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 {CLIENT_INFO.name}. {t.footer.rights}</p>
      </div>
    </footer>
  )
}
