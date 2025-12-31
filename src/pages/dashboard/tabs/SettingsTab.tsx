import { User } from '../../../types'
import { useState } from 'react'
import '../../../styles/dashboard/Settings.css'

interface Props {
  user: User
  formatDate: (date: string) => string
  t: any
}

export function SettingsTab({ user, formatDate: _formatDate, t }: Props) {
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
              <img 
                src="/send-mail.png" 
                alt="Send" 
                className="send-icon"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            </button>
            <img 
              src="/12.png" 
              alt="Friend" 
              className="friend-avatar"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
