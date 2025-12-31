import { useState } from 'react'
import { User } from '../../../types'
import { getAvatarUrl } from '../../../utils/avatarGenerator'

interface UsersTabProps {
  users: User[]
  onBanUser: (userId: number | string) => void
  onDeleteUser: (userId: number | string) => void
}

export function UsersTab({ users, onBanUser, onDeleteUser }: UsersTabProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Управление пользователями</h2>
        <p>Просмотр, блокировка и удаление пользователей</p>
      </div>

      <div className="search-bar">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
        </svg>
        <input
          type="text"
          placeholder="Поиск по имени или email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Пользователь</th>
              <th>Email</th>
              <th>Подписка</th>
              <th>Дата регистрации</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className={user.isBanned ? 'banned' : ''}>
                <td>#{user.id}</td>
                <td>
                  <div className="user-cell">
                    <img src={getAvatarUrl(user.avatar)} alt={user.username} className="user-avatar" />
                    <span>{user.username}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`subscription-badge ${user.subscription}`}>
                    {user.subscription === 'premium' ? 'Premium' : 
                     user.subscription === 'alpha' ? 'Alpha' : 'Free'}
                  </span>
                </td>
                <td>{new Date(user.registeredAt).toLocaleDateString('ru-RU')}</td>
                <td>
                  {user.isBanned ? (
                    <span className="status-badge banned">Заблокирован</span>
                  ) : (
                    <span className="status-badge active">Активен</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className={`btn-action ${user.isBanned ? 'unban' : 'ban'}`}
                      onClick={() => onBanUser(user.id)}
                      title={user.isBanned ? 'Разблокировать' : 'Заблокировать'}
                    >
                      {user.isBanned ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM4.5 7.5a.5.5 0 010-1h7a.5.5 0 010 1h-7z"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M11.354 4.646a.5.5 0 0 0-.708 0l-6 6a.5.5 0 0 0 .708.708l6-6a.5.5 0 0 0 0-.708z"/>
                        </svg>
                      )}
                    </button>
                    <button 
                      className="btn-action delete"
                      onClick={() => onDeleteUser(user.id)}
                      title="Удалить"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1z"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>Пользователи не найдены</p>
          </div>
        )}
      </div>
    </div>
  )
}
