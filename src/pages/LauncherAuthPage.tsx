import { useEffect } from 'react'
import { getCurrentUser } from '../utils/database'
import { updateUser } from '../utils/api'
import { useTranslation } from '../hooks/useTranslation'

export default function LauncherAuthPage() {
    const { t } = useTranslation()
    useEffect(() => {
        // Небольшая задержка чтобы убедиться что localStorage инициализирован
        const checkAuth = setTimeout(async () => {
            let user = getCurrentUser()

            if (user) {
                console.log('User found, redirecting to launcher...', user)

                // Получаем HWID и порт из параметров URL
                const urlParams = new URLSearchParams(window.location.search)
                const port = urlParams.get('port') || 3000
                const hwid = urlParams.get('hwid')

                // Если есть HWID и он отличается, обновляем его
                if (hwid && user.hwid !== hwid) {
                    try {
                        console.log('Updating HWID...', hwid)
                        const result = await updateUser(user.id, { hwid })
                        if (result.success && result.data) {
                            console.log('HWID updated successfully')
                            // Обновляем локального пользователя с данными от сервера (где уже есть HWID)
                            // Но нам важнее, чтобы он был в user, который мы отправляем в лаунчер
                            // user = result.data // result.data might contain mapped user which is good

                            // Мы можем просто добавить hwid в текущий объект, если сервер вернул успех
                            user.hwid = hwid
                        }
                    } catch (e) {
                        console.error('Failed to update HWID', e)
                    }
                }

                // Кодируем данные пользователя для передачи в лаунчер
                const userData = encodeURIComponent(JSON.stringify(user))

                // Редиректим на локальный сервер лаунчера
                window.location.href = `http://127.0.0.1:${port}/callback?user=${userData}`

                // Закрываем окно после успешной отправки данных в лаунчер
                setTimeout(() => {
                    window.close()
                }, 1000)
            } else {
                console.log('User not found, redirecting to login...')
                // Если не авторизован, редиректим на страницу входа
                // Добавляем параметр чтобы после входа можно было вернуться (опционально)
                const urlParams = new URLSearchParams(window.location.search)
                const hwid = urlParams.get('hwid')
                let redirectUrl = '/auth?redirect=launcher'
                if (hwid) {
                    redirectUrl += `&hwid=${encodeURIComponent(hwid)}`
                }
                window.location.href = redirectUrl
            }
        }, 500)

        return () => clearTimeout(checkAuth)
    }, [])

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#0a0a0f',
            color: 'white',
            fontFamily: 'sans-serif'
        }}>
            <div style={{
                padding: '30px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(138, 75, 255, 0.3)',
                    borderTopColor: '#8A4BFF',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                }} />
                <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>{t.auth.checkingAuth}</h2>
                <p style={{ margin: 0, opacity: 0.6 }}>{t.auth.pleaseWait}</p>
            </div>
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    )
}
