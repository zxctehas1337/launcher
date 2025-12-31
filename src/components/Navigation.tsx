import { useEffect, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import LanguageSelector from './ThemeLanguageSelector'
import { getCurrentUser } from '../utils/database'
import { getAvatarUrl } from '../utils/avatarGenerator'
import { IconHome, IconSnow, IconSun } from './icons/NavigationIcons'
import { MoonIcon } from './icons/MoonIcon'
import { IconShoppingBag } from './icons/UIIcons'
import { IconShield, IconDocument } from './icons/DashboardIcons'

// Static version of IconChecklist for navigation (no animations)
const IconChecklistStatic: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg
    className={className || ''}
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="8" y="6" width="32" height="36" rx="2" strokeOpacity="0.8" />
    <path d="M16 14H32" />
    <path d="M16 22H32" />
    <path d="M16 30H26" />
  </svg>
)

interface NavigationProps {
  onLanguageChange: () => void
}

export default function Navigation({ onLanguageChange }: NavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [settings, setSettings] = useState({
    snowEnabled: true,
    theme: 'dark'
  })
  const [isSnowflakeAnimating, setIsSnowflakeAnimating] = useState(false)

  useEffect(() => {
    const updateAuth = () => {
      const user = getCurrentUser()
      setCurrentUser(user)
    }

    // Load settings
    const saved = localStorage.getItem('userSettings')
    if (saved) {
      const parsedSettings = JSON.parse(saved)
      setSettings(parsedSettings)
      document.body.setAttribute('data-theme', parsedSettings.theme)
    }

    updateAuth()
    window.addEventListener('storage', updateAuth)
    window.addEventListener('currentUserChanged', updateAuth)

    return () => {
      window.removeEventListener('storage', updateAuth)
      window.removeEventListener('currentUserChanged', updateAuth)
    }
  }, [])

  const updateSettings = (newSettings: typeof settings) => {
    setSettings(newSettings)
    localStorage.setItem('userSettings', JSON.stringify(newSettings))
    document.body.setAttribute('data-theme', newSettings.theme)

    // Dispatch custom event to notify Snowfall component
    window.dispatchEvent(new CustomEvent('userSettingsChanged', { detail: newSettings }))
  }

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark'
    updateSettings({ ...settings, theme: newTheme })
  }

  const toggleSnow = () => {
    // Trigger animation
    setIsSnowflakeAnimating(true)
    setTimeout(() => setIsSnowflakeAnimating(false), 600)
    
    updateSettings({ ...settings, snowEnabled: !settings.snowEnabled })
  }

  return (
    <nav className="navbar-pill-container">
      <div className="navbar-pill">
        <div className="nav-links-centered">
          <Link to="/" className={`nav-link-pill ${location.pathname === '/' ? 'active' : ''}`}>
            <IconHome size={16} />
            <span>Home</span>
          </Link>
          <button onClick={() => navigate('/pricing')} className="nav-link-pill">
            <IconShoppingBag size={16} />
            <span>Products</span>
          </button>
          <button onClick={() => navigate('/personal-data')} className="nav-link-pill">
            <IconShield size={16} />
            <span>Privacy Policy</span>
          </button>
          <button onClick={() => navigate('/user-agreement')} className="nav-link-pill">
            <IconDocument size={16} />
            <span>Terms of Service</span>
          </button>
          <button onClick={() => navigate('/usage-rules')} className="nav-link-pill">
            <IconChecklistStatic size={16} />
            <span>Usage Rules</span>
          </button>
        </div>

        <div className="nav-right">
          <div className="nav-toggles" style={{ display: 'flex', gap: '8px', marginRight: '8px', alignItems: 'center' }}>
            <button
              onClick={toggleSnow}
              className={`nav-icon-btn ${settings.snowEnabled ? 'active' : ''} ${isSnowflakeAnimating ? 'snowflake-click' : ''}`}
              title={settings.snowEnabled ? "Disable Snow" : "Enable Snow"}
              style={{ padding: '8px', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}
            >
              <IconSnow size={18} />
            </button>
            <button
              onClick={toggleTheme}
              className="nav-icon-btn"
              title={settings.theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{ padding: '8px', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}
            >
              {settings.theme === 'dark' ? <IconSun size={18} /> : <MoonIcon size={18} />}
            </button>
          </div>

          <LanguageSelector onLanguageChange={onLanguageChange} />

          {currentUser ? (
            <button onClick={() => navigate('/dashboard')} className="nav-signin-pill">
              <img
                src={getAvatarUrl(currentUser.avatar)}
                alt="Avatar"
                className="nav-avatar-pill"
              />
              <span>{currentUser.username}</span>
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="nav-signin-pill">Sign In</button>
              <button onClick={() => navigate('/register')} className="nav-signup-pill">Sign Up</button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
