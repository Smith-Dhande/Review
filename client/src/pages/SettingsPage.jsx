import { useState } from 'react'
import { Bell, Shield, User } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const { user } = useAuth()

  const [fullName, setFullName] = useState(user?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)

  const handleProfileSubmit = (e) => {
    e.preventDefault()
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account and application settings"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
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

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <div className="px-6 py-4 border-t border-border flex justify-end">
            <Button type="submit" variant="primary">
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
                  Export businesses, QR codes, and NFC tag records
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
