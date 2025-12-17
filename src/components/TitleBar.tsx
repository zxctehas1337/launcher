import { useState, useRef, useEffect } from 'react'
import { useLanguage, type Language } from '../contexts/LanguageContext'
import '../styles/TitleBar.css'

// SVG Flag Components
const RussianFlag = () => (
  <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="15" rx="2" fill="white"/>
    <rect y="5" width="20" height="5" fill="#0039A6"/>
    <rect y="10" width="20" height="5" fill="#D52B1E"/>
  </svg>
)

const BritishFlag = () => (
  <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="15" rx="2" fill="#012169"/>
    <path d="M0 0L20 15M20 0L0 15" stroke="white" strokeWidth="3"/>
    <path d="M0 0L20 15M20 0L0 15" stroke="#C8102E" strokeWidth="2"/>
    <path d="M10 0V15M0 7.5H20" stroke="white" strokeWidth="5"/>
    <path d="M10 0V15M0 7.5H20" stroke="#C8102E" strokeWidth="3"/>
  </svg>
)

const LANGUAGES = [
  { code: 'ru' as Language, flag: <RussianFlag />, name: 'Русский' },
  { code: 'en' as Language, flag: <BritishFlag />, name: 'English' },
]

export default function TitleBar() {
  const { language, setLanguage, t } = useLanguage()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleLanguageSelect = (langCode: Language) => {
    setLanguage(langCode)
    setIsDropdownOpen(false)
  }

  const handleMinimize = async () => {
    try {
      if (window.electron?.minimize) {
        await window.electron.minimize()
      }
    } catch (error) {
      console.error('Error minimizing window:', error)
    }
  }

  const handleClose = async () => {
    try {
      if (window.electron?.close) {
        await window.electron.close()
      }
    } catch (error) {
      console.error('Error closing window:', error)
    }
  }

  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="titlebar-left" data-tauri-drag-region>
        <div className="app-logo">SHAKEDOWN</div>
        <div className="language-selector-wrapper" ref={dropdownRef}>
          <div
            className="language-selector"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="language-flag">{currentLang.flag}</span>
            <span className="language-text">{currentLang.name}</span>
            <span className={`language-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
          </div>
          {isDropdownOpen && (
            <div className="language-dropdown">
              {LANGUAGES.map(lang => (
                <div
                  key={lang.code}
                  className={`language-option ${lang.code === language ? 'active' : ''}`}
                  onClick={() => handleLanguageSelect(lang.code)}
                >
                  <span className="language-flag">{lang.flag}</span>
                  <span className="language-text">{lang.name}</span>
                  {lang.code === language && (
                    <svg className="check-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8L6 11L13 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="titlebar-right">
        <button className="title-btn" onClick={handleMinimize} title={t('titlebar.minimize')}>
          <svg width="12" height="2" viewBox="0 0 12 2" fill="currentColor">
            <rect width="12" height="2" rx="1" />
          </svg>
        </button>
        <button className="title-btn close-btn" onClick={handleClose} title={t('titlebar.close')}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M11 1L1 11M1 1L11 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
