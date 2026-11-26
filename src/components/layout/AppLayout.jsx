import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileTabBar from './MobileTabBar'

const STORAGE_KEY = 'rb_sidebar_collapsed'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {
      // Ignore storage errors
    }
  }, [collapsed])

  const handleToggle = () => {
    setCollapsed((prev) => !prev)
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <main
        className={`ml-0 ${
          collapsed ? 'md:ml-16' : 'md:ml-[240px]'
        } transition-all duration-200 min-h-screen bg-bg pb-20 md:pb-8`}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
      <MobileTabBar />
    </div>
  )
}
