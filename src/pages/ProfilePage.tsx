import type { User } from '../types'
import { useLanguage } from '../contexts/LanguageContext'
import { useEffect } from 'react'
import '../styles/ProfilePage.css'

interface ProfilePageProps {
  user: User
  onLogout: () => void
  onUserUpdate?: (user: User) => void
}

export default function ProfilePage({ user }: ProfilePageProps) {
  const { t } = useLanguage()

  // Предзагружаем часто используемые ссылки при монтировании компонента
  useEffect(() => {
    const urls = [
      'https://shakedown.vercel.app/pricing',
      'https://shakedown.vercel.app/dashboard',
      'https://shakedown.vercel.app/dashboard/subscription'
    ]
    
    urls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      document.head.appendChild(link)
    })
  }, [])

  const subscriptionEndDate = user.subscription === 'premium'
    ? t('profile.active')
    : user.subscription === 'alpha'
      ? t('profile.alpha_access')
      : t('profile.not_purchased')

  const handleOpenPersonalCabinet = () => {
    window.electron?.openExternal('https://shakedown.vercel.app/dashboard')
  }

  const handleExtendSubscription = () => {
    window.electron?.openExternal('https://shakedown.vercel.app/pricing')
  }


  const handleActivateKey = () => {
    window.electron?.openExternal('https://shakedown.vercel.app/dashboard/subscription')
  }

  return (
    <div className="page profile-page">
      {/* Top Section - Avatar & Profile */}
      <div className="profile-top">
        {/* Avatar Section */}
        <div className="avatar-section">
          <h3 className="card-title">{t('profile.avatar')}</h3>

          <div className="avatar-container">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random&color=fff&size=256&bold=true`}
              alt={user.username}
            />
          </div>

          <p className="avatar-text">{t('profile.upload_change_avatar')}</p>

          <button className="avatar-upload-btn">
            {t('profile.upload')}
          </button>
        </div>

        {/* Profile Info Section */}
        <div className="profile-section">
          <h3 className="card-title">{t('sidebar.profile')}</h3>

          <div className="profile-fields">
            <div className="profile-field">
              <span className="profile-field-label">{t('profile.uid')}</span>
              <span className="profile-field-colon">:</span>
              <span className="profile-field-value">{user.id}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">{t('profile.login')}</span>
              <span className="profile-field-colon">:</span>
              <span className="profile-field-value">{user.username}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">{t('profile.group')}</span>
              <span className="profile-field-colon">:</span>
              <span className="profile-field-value">
                {user.subscription === 'premium' ? t('profile.premium') :
                  user.subscription === 'alpha' ? t('profile.alpha') : t('profile.user')}
              </span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">{t('profile.client_purchased_until')}</span>
              <span className="profile-field-colon">:</span>
              <span className={`profile-field-value ${user.subscription !== 'free' ? 'subscription-active' : 'subscription-inactive'}`}>
                {subscriptionEndDate}
              </span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">HWID</span>
              <span className="profile-field-colon">:</span>
              <span className="profile-field-value">
                {user.hwid || "Не привязан"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="actions-section">
        <h3 className="card-title">{t('profile.useful')}</h3>

        <div className="actions-grid">
          <button className="action-btn" onClick={handleOpenPersonalCabinet}>
            {t('profile.personal_cabinet')}
          </button>
          <button className="action-btn" onClick={handleExtendSubscription}>
            {t('profile.extend_subscription')}
          </button>
          <button className="action-btn full-width" onClick={handleActivateKey}>
            {t('profile.activate_key')}
          </button>
        </div>
      </div>
    </div>
  )
}
