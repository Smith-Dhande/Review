import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  QrCode,
  BarChart3,
  Settings,
} from 'lucide-react'

const TAB_ITEMS = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Businesses', path: '/businesses', icon: Building2 },
  { label: 'QR Codes', path: '/qr-codes', icon: QrCode },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export default function MobileTabBar() {
  const location = useLocation()

  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    )
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 h-14 bg-card border-t border-border z-30 md:hidden flex items-center justify-around"
    >
      {TAB_ITEMS.map((item) => {
        const Icon = item.icon
        const active = isActivePath(item.path)

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 transition-colors duration-150 ${
              active
                ? 'text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
