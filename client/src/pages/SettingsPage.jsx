import { useState } from 'react'
import { Bell, Shield, User } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Input from '../components/ui/Input'
import PasswordInput from '../components/ui/PasswordInput'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const { user, changePassword } = useAuth()

  const [fullName, setFullName] = useState(user?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)

  const handleProfileSubmit = (e) => {
    e.preventDefault()
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setPasswordLoading(true)
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      setPasswordSuccess(res.message || 'Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.message || 'Could not update password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account and application settings"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
        ]}
      />

      <div className="flex flex-col gap-6 mt-6">
        {/* Profile Section */}
        <form
          onSubmit={handleProfileSubmit}
          className="bg-card rounded-lg border border-border"
        >
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <User className="w-5 h-5 text-text-secondary" />
            <h2 className="text-sm font-semibold text-text-primary">Profile</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-surface text-text-secondary cursor-not-allowed"
            />
            <Input
              label="Role"
              name="role"
              value={user?.role || 'Administrator'}
              disabled
              className="bg-surface text-text-secondary cursor-not-allowed"
            />
          </div>

          <div className="px-6 py-4 border-t border-border flex justify-end">
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>

        {/* Security Section */}
        <form
          onSubmit={handlePasswordSubmit}
          className="bg-card rounded-lg border border-border"
        >
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <Shield className="w-5 h-5 text-text-secondary" />
            <h2 className="text-sm font-semibold text-text-primary">
              Security
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <PasswordInput
                  label="Current Password"
                  name="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <PasswordInput
                label="New Password"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 10 chars, upper, lower, number, symbol"
                required
              />
              <PasswordInput
                label="Confirm Password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            {passwordError && (
              <div
                role="alert"
                className="bg-error-light border border-error-border rounded-md px-3 py-2 text-xs text-error"
              >
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <p className="text-xs font-medium text-status-active">
                {passwordSuccess}
              </p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border flex justify-end">
            <Button type="submit" variant="primary" loading={passwordLoading}>
              Update Password
            </Button>
          </div>
        </form>

        {/* Application Section */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <Bell className="w-5 h-5 text-text-secondary" />
            <h2 className="text-sm font-semibold text-text-primary">
              Application
            </h2>
          </div>

          <div className="px-6 py-3">
            <div className="flex justify-between items-center py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Email Notifications
                </p>
                <p className="text-xs text-text-tertiary">
                  Receive email alerts for new scans
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailNotifications}
                aria-label="Toggle email notifications"
                onClick={() => setEmailNotifications((prev) => !prev)}
                className={`relative inline-flex items-center rounded-full w-10 h-5 transition-colors duration-150 cursor-pointer ${
                  emailNotifications ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`inline-block w-3.5 h-3.5 rounded-full bg-white transition-transform duration-150 ${
                    emailNotifications ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-between items-center py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Data Export
                </p>
                <p className="text-xs text-text-tertiary">
                  Export businesses and review configuration records
                </p>
              </div>
              <Button type="button" variant="secondary">
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
