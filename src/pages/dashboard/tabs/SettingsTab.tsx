import { User } from '../../../types'
import { useState } from 'react'
import '../../../styles/dashboard/Settings.css'

interface Props {
  user: User
  formatDate: (date: string) => string
  t: any
}

export function SettingsTab({ user: _user, formatDate: _formatDate, t }: Props) {
  const [friendUsername, setFriendUsername] = useState('')

  const handleAddFriend = () => {
    if (!friendUsername.trim()) return
    // Здесь будет логика добавления друга
    console.log('Adding friend:', friendUsername)
    setFriendUsername('')
  }

  return (
    <div className="dashboard-content">
      <div className="settings-card">
        <div className="setting-item">
          <div className="setting-info">
            <h4>{t.dashboard?.addFriend || 'Add Friend'}</h4>
          </div>
          <div className="friend-add-group">
            <input
              type="text"
              className="friend-input"
              placeholder={t.dashboard.enterFriendUsername}
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
            />
            <button className="setting-btn" onClick={handleAddFriend}>
              {t.dashboard?.send || 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
