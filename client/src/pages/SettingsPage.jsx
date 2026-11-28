import { useState } from 'react'
import { Download, Shield, User } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Input from '../components/ui/Input'
import PasswordInput from '../components/ui/PasswordInput'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { businessesApi } from '../services/api'

export default function SettingsPage() {
  const { user, updateProfile, changePassword } = useAuth()
  const { showToast } = useToast()

  const [fullName, setFullName] = useState(user?.name || '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileMessage('')
    if (!fullName.trim()) {
      setProfileError('Full name is required.')
      return
    }
    setProfileLoading(true)
    try {
      await updateProfile({ name: fullName.trim() })
      setProfileMessage('Profile updated.')
      showToast({
        type: 'success',
        title: 'Settings saved',
        message: 'Administrator profile updated successfully.',
      })
      setTimeout(() => setProfileMessage(''), 2500)
    } catch (err) {
      const msg = err.message || 'Could not update profile.'
      setProfileError(msg)
      showToast({ type: 'error', title: 'Failed to save settings', message: msg })
    } finally {
      setProfileLoading(false)
    }
  }

  const handleExportData = async () => {
    if (exporting) return
    setExportError('')
    setExporting(true)
    try {
      const blob = await businessesApi.exportData()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'reviewbuddy-businesses-export.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showToast({
        type: 'success',
        title: 'Export downloaded',
        message: 'Business records exported as JSON.',
      })
    } catch (err) {
      const msg = err.message || 'Could not export business records.'
      setExportError(msg)
      showToast({ type: 'error', title: 'Export failed', message: msg })
    } finally {
      setExporting(false)
    }
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
      showToast({
        type: 'success',
        title: 'Password updated',
        message: res.message || 'Password updated successfully.',
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const msg = err.message || 'Could not update password.'
      setPasswordError(msg)
      showToast({ type: 'error', title: 'Password update failed', message: msg })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your administrator account and export business records"
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
              required
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

          <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-4">
            <div>
              {profileError && (
                <span role="alert" className="text-xs text-error">
                  {profileError}
                </span>
              )}
              {profileMessage && (
                <span className="text-xs font-medium text-status-active">
                  {profileMessage}
                </span>
              )}
            </div>
            <Button type="submit" variant="primary" loading={profileLoading}>
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

        {/* Data Export Section */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <Download className="w-5 h-5 text-text-secondary" />
            <h2 className="text-sm font-semibold text-text-primary">
              Data Backup
            </h2>
          </div>

          <div className="px-6 py-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Export Business Records
                </p>
                <p className="text-xs text-text-tertiary">
                  Download all businesses, questionnaires, and review
                  configuration records as JSON
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                loading={exporting}
                onClick={handleExportData}
              >
                Export Data
              </Button>
            </div>

            {exportError && (
              <div
                role="alert"
                className="bg-error-light border border-error-border rounded-md px-3 py-2 text-xs text-error"
              >
                {exportError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
