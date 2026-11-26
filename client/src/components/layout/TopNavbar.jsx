export default function TopNavbar() {
  return (
    <header className="h-16 bg-sidebar border-b border-sidebar-border sticky top-0 z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Mobile brand mark when sidebar is hidden */}
      <div className="md:hidden text-base font-bold text-white tracking-tight">
        ReviewBuddy
      </div>

      {/* Intentionally empty on desktop — clean structural balance */}
      <div className="hidden md:block" aria-hidden="true" />
      <div aria-hidden="true" />
    </header>
  )
}
