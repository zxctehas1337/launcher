import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Notification from '../../components/Notification'
import { NotificationType } from '../../types'
import LogoWithHat from '../../components/LogoWithHat'
import Navigation from '../../components/Navigation'
import { getCurrentUser, Database, setCurrentUser } from '../../utils/database'
import '../../styles/auth/AuthBase.css'
import '../../styles/auth/AuthForm.css'
import '../../styles/auth/AuthModal.css'

export default function LoginPage() {
    const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null)
    const [login, setLogin] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()

    useEffect(() => {
        const user = getCurrentUser()
        if (user) {
            navigate(user.isAdmin ? '/admin' : '/dashboard')
        }
    }, [navigate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!login || !password) {
            setNotification({ message: 'Заполните все поля', type: 'error' })
            return
        }

        setIsLoading(true)
        try {
            const db = new Database()
            const result = await db.login(login, password)

            if (result.success && result.user) {
                setCurrentUser(result.user)
                setNotification({ message: 'Вход выполнен!', type: 'success' })
                setTimeout(() => {
                    navigate(result.user?.isAdmin ? '/admin' : '/dashboard')
                }, 600)
            } else {
                setNotification({ message: result.message || 'Неверный логин или пароль', type: 'error' })
            }
        } catch (error) {
            setNotification({ message: 'Ошибка подключения к серверу', type: 'error' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-fullscreen">
            <Navigation onLanguageChange={() => { }} />

            <div className="auth-page-centered">
                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}

                <div className="auth-box-clean">
                    <div className="auth-header">
                        <div className="auth-logo-small">
                            <LogoWithHat size={180} alt="ShakeDown Logo" />
                        </div>
                        <div className="auth-title-clean">
                            <h2>Welcome back!</h2>
                            <p>You dont gave account? <Link to="/register" style={{ color: '#ff8c00', textDecoration: 'none' }}>Sign up right now!</Link></p>
                        </div>
                    </div>

                    <div className="auth-form-clean">
                        <form onSubmit={handleSubmit} className="admin-form-clean">
                            <div className="form-group-clean">
                                <label>Login</label>
                                <input
                                    type="text"
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                    placeholder="Username"
                                    className="input-clean"
                                    required
                                />
                            </div>

                            <div className="form-group-clean">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-clean"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-primary-clean" disabled={isLoading}>
                                {isLoading ? 'Processing...' : 'Sign In'}
                            </button>
                        </form>
                    </div>

                    <div className="auth-footer-clean">
                        <Link to="/" className="back-link-clean">
                            Back to Home
                        </Link>
                        <span className="version-tag">v3.1.9</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
