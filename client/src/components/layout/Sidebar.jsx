import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Businesses', path: '/businesses', icon: Building2 },
  { label: 'Digital Business Cards', path: '/digital-cards', icon: CreditCard },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActivePath = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    )
  }

  const userName = user?.name || 'Admin'
  const userRole = user?.role || 'Administrator'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <aside
      className={`hidden md:flex md:flex-col bg-sidebar fixed left-0 top-0 h-screen z-30 border-r border-sidebar-border transition-all duration-200 ease-in-out ${
        collapsed ? 'w-16' : 'w-[240px]'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-card border border-border shadow-xs flex items-center justify-center cursor-pointer hover:bg-surface transition-colors duration-150 text-text-secondary"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Brand header aligned with h-16 TopNavbar */}
      <div
        className={`h-16 flex items-center border-b border-sidebar-border shrink-0 ${
          collapsed ? 'justify-center px-2' : 'px-5'
        }`}
      >
        <Link
          to="/dashboard"
          className="text-[17px] font-bold text-white tracking-tight hover:opacity-90 transition-opacity"
        >
          {collapsed ? 'R' : 'ReviewBuddy'}
        </Link>
      </div>

      {/* Primary navigation — 3 focused items */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActivePath(item.path)

          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                collapsed ? 'justify-center' : ''
              } ${
                active
                  ? 'text-sidebar-text-active bg-sidebar-active'
                  : 'text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover'
              }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border mx-3" />

      {/* Admin profile & logout */}
      <div className="p-3">
        <div className="relative" ref={menuRef}>
          {menuOpen && (
            <div className="absolute bottom-full left-0 w-full min-w-[180px] mb-2 bg-card rounded-lg border border-border shadow-md py-1 z-50">
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface cursor-pointer transition-colors duration-150"
              >
                <User className="w-4 h-4 text-text-secondary" />
                <span>Account Settings</span>
              </Link>
              <div className="border-t border-border my-1" />
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false)
                  await logout()
                  showToast({
                    type: 'info',
                    title: 'Signed out',
                    message: 'You have been signed out.',
                  })
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-surface cursor-pointer transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`w-full flex items-center gap-3 py-2 rounded-md text-sidebar-text hover:bg-sidebar-hover cursor-pointer transition-colors duration-150 ${
              collapsed ? 'justify-center px-0' : 'px-2.5'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-sidebar-active border border-sidebar-border flex items-center justify-center text-xs font-medium text-sidebar-text-active flex-shrink-0">
              {userInitial}
            </div>
            {!collapsed && (
              <div className="text-left min-w-0">
                <div className="text-sm text-sidebar-text-active font-medium truncate">
                  {userName}
                </div>
                <div className="text-xs text-sidebar-text truncate">
                  {userRole}
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
