import { useEffect } from 'react'
import Notification from '../../components/Notification'
import { LogoutModal } from '../../components/LogoutModal'
import { SoonModal } from '../../components/SoonModal'
import { useDashboard } from './hooks/useDashboard'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAvatarUrl } from '../../utils/avatarGenerator'
import Navigation from '../../components/Navigation'
import { SettingsTab } from './tabs/SettingsTab'
import {
  IconProfile,
  IconSettings,
  IconKey,
  IconCheck,
  IconArrowRight,
  IconMail,
  IconClock,
  IconGrid,
  IconChip,
  IconLogout,
} from '../../components/Icons'
import { WindowsIcon, MacIcon, LinuxIcon } from '../../components/icons/OSIcons'
import { DOWNLOAD_LINKS } from '../../utils/constants'

import '../../styles/dashboard/DashboardBase.css'
import '../../styles/dashboard/DownloadButtons.css'

export default function DashboardPage() {
  const {
    user,
    notification,
    setNotification,
    showLogoutModal,
    setShowLogoutModal,
    showSoonModal,
    setShowSoonModal,
    keyInput,
    setKeyInput,
    activeTab,
    setActiveTab,
    t,
    handleLogout,
    handleActivateKey,
    formatDate,
  } = useDashboard()


  const handleDownloadLauncher = (platform: 'windows' | 'macos' | 'linux') => {
    const downloadUrl = DOWNLOAD_LINKS[platform]
    if (downloadUrl) {
      const link = document.createElement('a')
      link.href = downloadUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.click()
      
      // Show notification
      setNotification({
        message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${t.dashboard.launcherDownloadStarted || 'download started...'}`,
        type: 'success'
      })
      
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    } else {
      setNotification({
        message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} download not available`,
        type: 'error'
      })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleLanguageChange = () => {
    // Component will naturally re-render when translations change
    // as it's often listening to storage or event changes globally
  }

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const path = location.pathname.split('/').pop()
    if (path && ['profile', 'settings', 'overview'].includes(path)) {
      setActiveTab(path as any)
    }
  }, [location.pathname, setActiveTab])

  if (!user) return null

  return (
    <div className="new-dashboard">
      <Navigation onLanguageChange={handleLanguageChange} />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {showLogoutModal && (
        <LogoutModal
          isOpen={showLogoutModal}
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      {showSoonModal && (
        <SoonModal
          isOpen={showSoonModal}
          title="Soon..."
          message={(t.dashboard as any).soon || "Скоро"}
          onClose={() => setShowSoonModal(false)}
        />
      )}

      <div className="dashboard-wrapper">
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="dashboard-left">
            {/* Profile Card */}
            <div className="glass-card profile-info-card">
              <div className="profile-main">
                <div className="profile-avatar">
                  <img src={getAvatarUrl(user.avatar)} alt={user.username} />
                </div>
                <div className="profile-text">
                  <h3>
                    {user.profile?.displayName || user.username} <span className="profile-uid">[{user.id}]</span>
                  </h3>
                  <p>{t.dashboard.subscriptionTill}: {user.subscriptionEndDate ? formatDate(user.subscriptionEndDate) : t.dashboard.forever}</p>
                </div>
                <button className="profile-logout-btn" onClick={() => setShowLogoutModal(true)}>
                  <IconLogout size={18} />
                </button>
              </div>
            </div>

            {/* License Key Card */}
            <div className="glass-card license-activation-card">
              <span className="card-label">{t.dashboard.activateLicenseKey}</span>
              <div className="license-input-group">
                <div className="input-with-icon">
                  <IconKey size={16} />
                  <input
                    type="text"
                    placeholder={t.dashboard.enterKeyPlaceholder}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                  />
                </div>
                <button className="pink-btn" onClick={handleActivateKey}>
                  <IconCheck size={16} />
                  <span>{t.dashboard.activate}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="dashboard-right">
            {/* Navigation Tabs */}
            <div className="dashboard-nav">
              <button
                className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('profile')
                  navigate('/dashboard/profile')
                }}
              >
                <IconProfile size={16} />
                <span>{t.dashboard.accountTab}</span>
              </button>
              <button
                className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('settings')
                  navigate('/dashboard/settings')
                }}
              >
                <IconSettings size={16} />
                <span>{t.dashboard.settings}</span>
              </button>
              <button
                className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('overview')
                  navigate('/dashboard/overview')
                }}
              >
                <IconGrid size={16} />
                <span>{t.dashboard.launcherTab}</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content-wrapper">
              {activeTab === 'profile' && (
                <div className="account-details-row">
                  <div className="info-box">
                    <div className="info-header">
                      <IconMail size={14} />
                      <span>{t.dashboard.email}</span>
                    </div>
                    <div className="info-text">{user.email}</div>
                  </div>
                  <div className="info-box">
                    <div className="info-header">
                      <IconClock size={14} />
                      <span>{t.dashboard.registration}</span>
                    </div>
                    <div className="info-text">{new Date(user.registeredAt).toLocaleDateString()}</div>
                  </div>
                  <div className="info-box">
                    <div className="info-header">
                      <IconChip size={14} />
                      <span>{t.dashboard.hwid}</span>
                    </div>
                    <div className="info-text">{user.hwid || t.dashboard.notLinked}</div>
                  </div>
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="launcher-view">
                  {/* Download Buttons */}
                  <div className="download-buttons-grid">
                    <button className="download-os-btn windows" onClick={() => handleDownloadLauncher('windows')}>
                      <WindowsIcon size={20} />
                      <span>Windows</span>
                    </button>
                    <button className="download-os-btn macos" onClick={() => handleDownloadLauncher('macos')}>
                      <MacIcon size={20} />
                      <span>macOS</span>
                    </button>
                    <button className="download-os-btn linux" onClick={() => handleDownloadLauncher('linux')}>
                      <LinuxIcon size={20} />
                      <span>Linux</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <SettingsTab 
                  user={user} 
                  formatDate={formatDate} 
                  t={t} 
                />
              )}
            </div>

            {/* Bottom Cards Row */}
            <div className="bottom-row-grid">
              <div className="glass-card friends-box">
                <div className="friends-label">
                  <IconProfile size={14} />
                  <span>{t.dashboard.friends}</span>
                </div>
                <div className="friends-value">0</div>
                <div className="friends-arrow">
                  <IconArrowRight size={20} />
                </div>
              </div>
              <div className="glass-card diagonal-soon-card">
                <div className="soon-diagonal-text">{t.dashboard.soon}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


