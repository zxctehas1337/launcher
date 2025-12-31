import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Notification from '../../components/Notification'
import { NotificationType } from '../../types'
import Navigation from '../../components/Navigation'
import { VerificationModal } from './components/VerificationModal'
import { getCurrentUser, Database, setCurrentUser } from '../../utils/database'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import '../../styles/auth/AuthBase.css'
import '../../styles/auth/AuthForm.css'
import '../../styles/auth/AuthModal.css'

export default function RegisterPage() {
    const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null)
    const [showVerificationModal, setShowVerificationModal] = useState(false)
    const [pendingUserId, setPendingUserId] = useState<string | null>(null)

    const [email, setEmail] = useState('')
    const [login, setLogin] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

        if (!email || !login || !password || !confirmPassword) {
            setNotification({ message: 'Please fill all fields', type: 'error' })
            return
        }

        if (password !== confirmPassword) {
            setNotification({ message: 'Passwords do not match', type: 'error' })
            return
        }

        setIsLoading(true)
        try {
            const db = new Database()
            const result = await db.register(login, email, password)

            if (result.success && result.user) {
                if ((result as any).requiresVerification) {
                    setNotification({ message: result.message || 'Verification code sent to email', type: 'success' })
                    setPendingUserId(String(result.user.id))
                    setShowVerificationModal(true)
                } else {
                    setCurrentUser(result.user)
                    setNotification({ message: 'Account created!', type: 'success' })
                    setTimeout(() => {
                        navigate(result.user?.isAdmin ? '/admin' : '/dashboard')
                    }, 600)
                }
            } else {
                setNotification({ message: result.message || 'Registration failed', type: 'error' })
            }
        } catch (error) {
            setNotification({ message: 'Server connection error', type: 'error' })
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
                        <div className="auth-title-clean">
                            <h2>Hello, New User!</h2>
                            <p>You already registered? <Link to="/login" style={{ color: '#ff8c00', textDecoration: 'none' }}>Sign in right now!</Link></p>
                        </div>
                    </div>

                    <div className="auth-form-clean">
                        <form onSubmit={handleSubmit} className="admin-form-clean">
                            <div className="form-group-clean">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="input-clean"
                                    required
                                />
                            </div>

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
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input-clean"
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group-clean">
                                <label>Confirm Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input-clean"
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn-primary-clean" disabled={isLoading}>
                                {isLoading ? 'Processing...' : 'Sign Up'}
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

            {showVerificationModal && (
                <VerificationModal
                    pendingUserId={pendingUserId}
                    setNotification={setNotification}
                    onClose={() => setShowVerificationModal(false)}
                />
            )}
        </div>
    )
}
