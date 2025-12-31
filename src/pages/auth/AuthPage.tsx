import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Notification from '../../components/Notification'
import { NotificationType } from '../../types'
import { VerificationModal } from './components/VerificationModal'
import LogoWithHat from '../../components/LogoWithHat'
import { getCurrentUser, Database, setCurrentUser } from '../../utils/database'
import { useTranslation } from '../../hooks/useTranslation'
import '../../styles/auth/AuthBase.css'
import '../../styles/auth/AuthForm.css'
import '../../styles/auth/AuthModal.css'
import '../../styles/auth/AuthResponsive.css'

export default function AuthPage() {
  const { t } = useTranslation()
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      if (user.isAdmin) {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setNotification({ message: t.auth.fillAllFields, type: 'error' })
      return
    }

    setIsLoading(true)
    try {
      const db = new Database()

      // Try to login first
      const loginResult = await db.login(email, password)

      if (loginResult.success && loginResult.user) {
        setCurrentUser(loginResult.user)
        setNotification({ message: loginResult.message || t.auth.loginSuccess, type: 'success' })
        setTimeout(() => {
          navigate(loginResult.user?.isAdmin ? '/admin' : '/dashboard')
        }, 600)
        return
      }

      // If login failed, it might be that user doesn't exist.
      // Try to register. If email is taken, then login failed due to wrong password.
      const usernameFromEmail = email.split('@')[0] || 'user'
      const registerResult = await db.register(usernameFromEmail, email, password)

      if (registerResult.success && registerResult.user) {
        if ((registerResult as any).requiresVerification) {
          setNotification({ message: registerResult.message || t.auth.codeSent, type: 'success' })
          setPendingUserId(String(registerResult.user.id))
          setShowVerificationModal(true)
          return
        }

        setCurrentUser(registerResult.user)
        setNotification({ message: t.auth.accountCreated, type: 'success' })
        setTimeout(() => {
          navigate(registerResult.user?.isAdmin ? '/admin' : '/dashboard')
        }, 600)
      } else {
        // Handle registration failure
        const errorMsg = registerResult.message || ''
        if (errorMsg.includes('Email') || errorMsg.includes('уже')) {
          setNotification({ message: t.auth.incorrectPassword, type: 'error' })
        } else {
          setNotification({ message: errorMsg || t.auth.authError, type: 'error' })
        }
      }
    } catch (error) {
      console.error('Unified auth error:', error)
      setNotification({ message: t.auth.serverError, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
            <h2>{t.auth.welcome}</h2>
          </div>
        </div>

        <div className="auth-form-clean">
          <form onSubmit={handleSubmit} className="admin-form-clean">
            <div className="form-group-clean">
              <label>{t.auth.email}</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-clean"
                required
              />
            </div>

            <div className="form-group-clean">
              <label>{t.auth.password}</label>
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
              {isLoading ? t.auth.processing : t.auth.continue}
            </button>
          </form>
        </div>

        <div className="auth-footer-clean">
          <a href="/" className="back-link-clean">
            {t.auth.backToMain}
          </a>
          <span className="version-tag">v3.1.9</span>
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
