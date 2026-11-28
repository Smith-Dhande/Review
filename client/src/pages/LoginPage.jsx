import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Input from '../components/ui/Input'
import PasswordInput from '../components/ui/PasswordInput'
import Button from '../components/ui/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setLocalError('Please enter both email and password.')
      return
    }
    const success = await login(trimmedEmail, password)
    if (success) {
      showToast({
        type: 'success',
        title: 'Signed in',
        message: 'Welcome back to ReviewBuddy.',
      })
      navigate('/dashboard', { replace: true })
    } else {
      showToast({
        type: 'error',
        title: 'Sign in failed',
        message: 'Invalid email or password.',
      })
    }
  }

  const displayedError = localError || error

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Left Brand Panel — Editorial architectural composition */}
      <div className="hidden md:flex md:w-[54%] bg-[#121312] relative overflow-hidden flex-col justify-between p-12 border-r border-[#232523]">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute top-0 left-12 w-px h-full bg-[#1B6B4A]/30 pointer-events-none"
        />

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-lg font-bold text-white tracking-tight">
            ReviewBuddy
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-xs font-medium uppercase tracking-widest text-[#3B9B72] mb-4">
            QR &amp; NFC Review Operations
          </p>
          <h1 className="text-[40px] leading-[1.12] font-semibold text-white tracking-tight">
            Manage businesses,
            <br />
            streamline feedback.
          </h1>
          <p className="text-sm text-[#9A9E9B] leading-relaxed mt-5">
            Configure custom questionnaires, deploy QR and NFC touchpoints, and
            monitor customer journey conversion across every location.
          </p>

          <div className="mt-10 pt-6 border-t border-[#262826] grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-[#6E726F]">Touchpoints</p>
              <p className="text-sm font-medium text-white mt-1">QR &amp; NFC</p>
            </div>
            <div>
              <p className="text-xs text-[#6E726F]">Workflow</p>
              <p className="text-sm font-medium text-white mt-1">Guided Drafts</p>
            </div>
            <div>
              <p className="text-xs text-[#6E726F]">Access</p>
              <p className="text-sm font-medium text-white mt-1">Internal Only</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-[#5E625F]">
          © 2026 ReviewBuddy
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 bg-bg flex items-center justify-center p-6 sm:p-10 md:p-14">
        <div className="w-full max-w-[360px]">
          <div className="text-lg font-bold text-text-primary tracking-tight mb-8 md:hidden">
            ReviewBuddy
          </div>

          <h2 className="text-[26px] font-semibold tracking-tight text-text-primary">
            Sign in
          </h2>
          <p className="text-sm text-text-secondary mt-1.5 mb-8">
            Enter your administrator credentials to continue.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="admin@reviewbuddy.com"
              value={email}
              onChange={(e) => {
                if (error) clearError()
                if (localError) setLocalError('')
                setEmail(e.target.value)
              }}
              autoComplete="email"
              required
            />

            <div className="mt-4">
              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  if (error) clearError()
                  if (localError) setLocalError('')
                  setPassword(e.target.value)
                }}
                autoComplete="current-password"
                required
              />
            </div>

            {displayedError && (
              <div
                role="alert"
                className="bg-error-light border border-error-border rounded-md px-3 py-2.5 text-sm text-error mt-4"
              >
                {displayedError}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              className="w-full mt-6"
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
