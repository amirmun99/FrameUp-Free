import { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useCanvasStore } from '../../store/useCanvasStore'

// Icons as simple SVG components
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="10" y1="4" x2="10" y2="16" />
      <line x1="4" y1="10" x2="16" y2="10" />
    </svg>
  )
}

function PaintbrushIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M15.5 2.5c-.8-.8-2-.8-2.8 0L8 7.2l4.8 4.8 4.7-4.7c.8-.8.8-2 0-2.8l-2-2zM7 8.2L2.5 12.7a2 2 0 000 2.8l2 2a2 2 0 002.8 0L11.8 13 7 8.2z" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M15.5 2.5c-.8-.8-2-.8-2.8 0L8 7.2l4.8 4.8 4.7-4.7c.8-.8.8-2 0-2.8l-2-2zM7 8.2L2.5 12.7a2 2 0 000 2.8l2 2a2 2 0 002.8 0L11.8 13 7 8.2z" />
    </svg>
  )
}

function FolderIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 5a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 5a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
    </svg>
  )
}

function GridIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  )
}

function SettingsIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="3" />
      <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947z" />
    </svg>
  )
}

interface NavItemProps {
  to: string
  icon: (props: { filled?: boolean }) => JSX.Element
  label: string
}

function NavItem({ to, icon: Icon, label }: NavItemProps) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <NavLink
      to={to}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-120 ${
        isActive ? 'text-primary bg-surface' : 'text-text-secondary hover:text-primary hover:bg-surface'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
      )}
      <Icon filled={isActive} />
      {/* Tooltip */}
      <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100">
        {label}
      </span>
    </NavLink>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { zoom, canvasWidth, canvasHeight } = useCanvasStore()

  return (
    <div className="flex h-[calc(100vh-36px)] flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Nav rail - 48px */}
        <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-white py-3">
          <NavItem to="/" icon={FolderIcon} label="Projects" />
          <NavLink
            to="/capture"
            className="group relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:text-primary hover:bg-surface transition-colors duration-120"
          >
            <PlusIcon />
            <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100">
              New capture
            </span>
          </NavLink>
          <NavItem to="/library" icon={GridIcon} label="Capture library" />
          <NavItem to="/editor" icon={PaintbrushIcon} label="Canvas editor" />
          <div className="flex-1" />
          <NavItem to="/settings" icon={SettingsIcon} label="Settings" />

          {/* GitHub link */}
          <button
            onClick={() => window.open('https://github.com/amirmun99/FrameUp-Free', '_blank')}
            title="View on GitHub"
            className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:text-primary hover:bg-surface transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M9 0C4.037 0 0 4.037 0 9c0 3.977 2.58 7.35 6.16 8.54.45.083.615-.195.615-.433 0-.213-.008-.78-.012-1.53-2.506.544-3.034-1.208-3.034-1.208-.41-1.04-1-1.317-1-1.317-.817-.558.062-.547.062-.547.904.064 1.38.928 1.38.928.803 1.376 2.108.978 2.622.748.081-.582.314-.978.571-1.203-2-.227-4.104-1-4.104-4.452 0-.984.352-1.788.928-2.419-.093-.227-.402-1.145.088-2.386 0 0 .757-.242 2.48.924A8.645 8.645 0 019 4.372c.766.004 1.538.104 2.259.304 1.722-1.166 2.478-.924 2.478-.924.491 1.241.182 2.159.089 2.386.578.631.927 1.435.927 2.42 0 3.462-2.108 4.222-4.115 4.445.323.278.611.828.611 1.668 0 1.204-.011 2.174-.011 2.47 0 .24.163.52.619.432C15.423 16.347 18 12.975 18 9c0-4.963-4.037-9-9-9z" />
            </svg>
          </button>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      {/* Status bar - 32px */}
      <div className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-white px-4">
        <div className="flex items-center gap-4 text-xs text-text-tertiary">
          <span>{Math.round(zoom * 100)}%</span>
          <span>
            {canvasWidth} x {canvasHeight}
          </span>
        </div>
        <div className="text-xs text-text-tertiary">Open Source</div>
      </div>
    </div>
  )
}
