import { useState, useEffect, useRef } from 'react'
import '../styles/ThemeLanguageSelector.css'
import { LANGUAGES } from '../utils/constants'

interface LanguageSelectorProps {
  onLanguageChange?: (lang: string) => void
  dropdownDirection?: 'up' | 'down'
}

function LanguageSelector({ onLanguageChange, dropdownDirection = 'down' }: LanguageSelectorProps) {
  const [currentLang, setCurrentLang] = useState('ru')
  const [showLangMenu, setShowLangMenu] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'ru'
    setCurrentLang(savedLang)
  }, [])

  useEffect(() => {
    if (showLangMenu && toggleRef.current) {
      const isMobile = window.innerWidth <= 768
      const isSidebar = toggleRef.current.closest('.sidebar-language-selector')
      
      if (isMobile && isSidebar) {
        // For mobile sidebar, let CSS handle positioning
      }
    }
  }, [showLangMenu])

  const changeLanguage = (lang: string) => {
    setCurrentLang(lang)
    localStorage.setItem('language', lang)
    setShowLangMenu(false)
    onLanguageChange?.(lang)
  }

  const isMobileSidebar = () => {
    return window.innerWidth <= 768 && toggleRef.current?.closest('.sidebar-language-selector')
  }

  return (
    <div className="language-selector">
      <button 
        ref={toggleRef}
        className="lang-toggle"
        onClick={(e) => { e.stopPropagation(); setShowLangMenu(!showLangMenu); }}
      >
        <span className="lang-flag">{LANGUAGES[currentLang as keyof typeof LANGUAGES].flag}</span>
        <span className="lang-code">{currentLang.toUpperCase()}</span>
      </button>

      {showLangMenu && (
        <div 
          className={`lang-menu ${isMobileSidebar() ? 'lang-menu-sidebar-mobile' : (dropdownDirection === 'up' ? 'lang-menu-up' : 'lang-menu-down')}`}
        >
          {Object.entries(LANGUAGES).map(([code, lang]) => (
            <button
              key={code}
              className={`lang-option ${currentLang === code ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); changeLanguage(code); }}
            >
              <span className="lang-flag">{lang.flag}</span>
              <span className="lang-name">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageSelector
