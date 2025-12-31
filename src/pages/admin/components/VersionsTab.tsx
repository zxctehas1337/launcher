import { useMemo, useState } from 'react'
import { ClientVersion } from '../../../types'

interface VersionsTabProps {
  versions: ClientVersion[]
  onCreateVersion: (payload: { version: string; downloadUrl: string; description?: string; isActive?: boolean }) => void
  onUpdateVersion: (id: number, updates: Partial<Pick<ClientVersion, 'version' | 'downloadUrl' | 'description' | 'isActive'>>) => void
  onDeleteVersion: (id: number) => void
}

export function VersionsTab({ versions, onCreateVersion, onUpdateVersion, onDeleteVersion }: VersionsTabProps) {
  const [form, setForm] = useState<{ version: string; downloadUrl: string; description: string }>({
    version: '',
    downloadUrl: '',
    description: ''
  })
  const [editingId, setEditingId] = useState<number | null>(null)

  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => {
      const da = new Date(a.createdAt).getTime()
      const db = new Date(b.createdAt).getTime()
      if (da !== db) return db - da
      return b.id - a.id
    })
  }, [versions])

  const startEdit = (v: ClientVersion) => {
    setEditingId(v.id)
    setForm({
      version: v.version,
      downloadUrl: v.downloadUrl,
      description: String(v.description ?? '')
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({ version: '', downloadUrl: '', description: '' })
  }

  const submit = () => {
    if (!form.version.trim() || !form.downloadUrl.trim()) return

    if (editingId) {
      onUpdateVersion(editingId, {
        version: form.version.trim(),
        downloadUrl: form.downloadUrl.trim(),
        description: form.description
      })
      resetForm()
      return
    }

    onCreateVersion({
      version: form.version.trim(),
      downloadUrl: form.downloadUrl.trim(),
      description: form.description
    })
    resetForm()
  }

  const activate = (id: number) => {
    onUpdateVersion(id, { isActive: true })
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Версии клиента</h2>
        <p>Управление ссылками на скачивание клиента для лаунчера</p>
      </div>

      <div className="create-post-card">
        <h3>{editingId ? 'Редактировать версию' : 'Добавить версию'}</h3>

        <div className="form-group">
          <label>Версия</label>
          <input
            type="text"
            placeholder="Например: 1.2.3"
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Ссылка на скачивание (JAR/ZIP)</label>
          <input
            type="text"
            placeholder="https://..."
            value={form.downloadUrl}
            onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Описание</label>
          <textarea
            placeholder="Краткое описание изменений"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={submit}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {editingId ? 'Сохранить' : 'Добавить'}
          </button>
          {editingId && (
            <button className="btn-secondary" onClick={resetForm}>
              Отмена
            </button>
          )}
        </div>
      </div>

      <div className="keys-list">
        <h3>Список версий ({sortedVersions.length})</h3>

        {sortedVersions.length === 0 ? (
          <div className="empty-state">
            <p>Версий пока нет</p>
          </div>
        ) : (
          <div className="keys-table versions-table">
            <table>
              <thead>
                <tr>
                  <th>Версия</th>
                  <th>Ссылка</th>
                  <th>Статус</th>
                  <th>Создано</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {sortedVersions.map(v => (
                  <tr key={v.id} className={v.isActive ? 'version-active' : undefined}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code className="key-code">{v.version}</code>
                        {v.isActive && <span className="status-badge available">Активная</span>}
                      </div>
                    </td>
                    <td style={{ maxWidth: 420 }}>
                      <a href={v.downloadUrl} target="_blank" rel="noreferrer">{v.downloadUrl}</a>
                    </td>
                    <td>
                      {v.isActive ? (
                        <span className="status-badge available">Выбрана</span>
                      ) : (
                        <span className="status-badge used">Неактивна</span>
                      )}
                    </td>
                    <td>{new Date(v.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td>
                      <div className="action-buttons">
                        {!v.isActive && (
                          <button className="btn-action activate" onClick={() => activate(v.id)} title="Сделать активной">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                            </svg>
                          </button>
                        )}
                        <button className="btn-action" onClick={() => startEdit(v)} title="Редактировать">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M14.846 2.146a2 2 0 012.828 2.828l-9.9 9.9-3.535.707.707-3.535 9.9-9.9zM3 17h14v1H3v-1z"/>
                          </svg>
                        </button>
                        <button className="btn-action delete" onClick={() => onDeleteVersion(v.id)} title="Удалить">
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
          </div>
        )}
      </div>
    </div>
  )
}
