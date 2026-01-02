import { User } from '../../../types'
import { getAvatarUrl } from '../../../utils/avatarGenerator'

interface ActivityTabProps {
  users: User[]
}

export function ActivityTab({ users }: ActivityTabProps) {
  const now = new Date()

  // Данные для графика (регистрации за последние 7 дней)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(now.getDate() - (6 - i))
    return d
  })

  const chartData = last7Days.map(date => {
    const count = users.filter(u => {
      const regDate = new Date(u.registeredAt)
      return regDate.setHours(0, 0, 0, 0) === date.getTime()
    }).length
    return {
      label: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
      count
    }
  })

  const maxCount = Math.max(...chartData.map(d => d.count), 1)

  // Статистика
  const activeToday = users.filter(u => {
    if (!u.lastActiveAt) return false
    const lastActive = new Date(u.lastActiveAt)
    return now.getTime() - lastActive.getTime() < 24 * 60 * 60 * 1000
  }).length

  const premiumUsers = users.filter(u => u.subscription !== 'free').length
  const engagementRate = users.length > 0
    ? Math.round((premiumUsers / users.length) * 100)
    : 0

  return (
    <div className="admin-section">
      <div className="activity-stats">
        <div className="activity-chart-card">
          <h3>Регистрации за последние 7 дней</h3>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {chartData.map((data, i) => (
                <div key={i} className="chart-bar">
                  <div
                    className="bar-fill"
                    style={{ height: `${(data.count / maxCount) * 100}%` }}
                    title={`${data.count} рег.`}
                  ></div>
                  <div className="bar-label">{data.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="activity-info-grid">
          <div className="info-card">
            <div className="info-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM10 5C10.5523 5 11 5.44772 11 6V10C11 10.5523 10.5523 11 10 11C9.44772 11 9 10.5523 9 10V6C9 5.44772 9.44772 5 10 5ZM10 15C9.44772 15 9 14.5523 9 14C9 13.4477 9.44772 13 10 13C10.5523 13 11 13.4477 11 14C11 14.5523 10.5523 15 10 15Z" />
              </svg>
            </div>
            <div className="info-content">
              <div className="info-value">{users.length}</div>
              <div className="info-label">Всего пользователей</div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="10" r="8" />
              </svg>
            </div>
            <div className="info-content">
              <div className="info-value">{activeToday}</div>
              <div className="info-label">Активных за 24ч</div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z" />
              </svg>
            </div>
            <div className="info-content">
              <div className="info-value">{engagementRate}%</div>
              <div className="info-label">Доля Premium</div>
            </div>
          </div>
        </div>
      </div>

      <div className="recent-users">
        <h3>Недавно зарегистрированные</h3>
        <div className="users-list">
          {users.slice(0, 10).map(user => (
            <div key={user.id} className="user-item">
              <img src={getAvatarUrl(user.avatar)} alt={user.username} className="user-avatar-small" />
              <div className="user-item-info">
                <div className="user-item-name">{user.username}</div>
                <div className="user-item-date">{new Date(user.registeredAt).toLocaleDateString('ru-RU')}</div>
              </div>
              <span className={`subscription-badge ${user.subscription}`}>
                {user.subscription === 'premium' ? 'Premium' :
                  user.subscription === 'alpha' ? 'Alpha' : 'Free'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
