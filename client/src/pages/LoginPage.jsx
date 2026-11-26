import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import PasswordInput from '../components/ui/PasswordInput'
import Button from '../components/ui/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await login(email.trim(), password)
    if (success) {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden md:flex md:w-[55%] bg-[#111] relative overflow-hidden flex-col justify-between p-10">
        {/* Geometric decoration */}
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] border-2 border-[#1B6B4A]/20 rounded-full pointer-events-none" />
        <div className="absolute top-20 right-10 w-[300px] h-[300px] border border-[#1B6B4A]/10 rounded-full pointer-events-none" />
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#1B6B4A]/20 to-transparent top-1/2 left-0 pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-[420px] h-px bg-gradient-to-r from-transparent via-[#1B6B4A]/15 to-transparent rotate-45 pointer-events-none" />
        <div className="absolute bottom-24 right-24 w-32 h-32 border border-[#1B6B4A]/10 rotate-45 pointer-events-none" />

        <div className="text-xl font-bold text-white tracking-tight relative z-10">
          ReviewBuddy
        </div>

        <div className="relative z-10">
          <h1 className="text-[42px] leading-tight font-semibold text-white tracking-tight">
            Manage reviews,
            <br />
            build reputation.
          </h1>
          <p className="text-base text-[#888] mt-4">
            Smart review generation for local businesses.
          </p>
        </div>

        <div className="text-xs text-[#555] relative z-10">
          © 2026 ReviewBuddy
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 bg-bg flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="text-xl font-bold text-text-primary tracking-tight mb-8 md:hidden">
            ReviewBuddy
          </div>

          <h2 className="text-[28px] font-semibold tracking-tight text-text-primary">
            Welcome back
          </h2>
          <p className="text-sm text-text-secondary mt-2 mb-8">
            Sign in to your admin account
          </p>

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              placeholder="admin@reviewbuddy.com"
              value={email}
              onChange={(e) => {
                if (error) clearError()
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
                  setPassword(e.target.value)
                }}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="bg-error-light border border-error-border rounded-md px-3 py-2.5 text-sm text-error mt-4"
              >
                {error}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="text-sm text-text-secondary cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              className="w-full mt-6"
            >
              Sign in
            </Button>

            <div className="text-center mt-4">
              <button
                type="button"
                className="text-sm text-text-secondary hover:text-primary cursor-pointer transition-colors duration-150"
              >
                Forgot password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
