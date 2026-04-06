import { useState } from 'react'
import SourcePanel from './SourcePanel'
import DevicePanel from './DevicePanel'
import BackgroundPanel from './BackgroundPanel'
import OverlayPanel from './OverlayPanel'
import ExportPanel from './ExportPanel'
import { useAppStore } from '../../store/useAppStore'
import Badge from '../ui/Badge'
import { useNavigate } from 'react-router-dom'

type PanelId = 'source' | 'device' | 'background' | 'overlay' | 'export'

interface PanelSection {
  id: PanelId
  label: string
  component: () => JSX.Element
}

const panels: PanelSection[] = [
  { id: 'source', label: 'Source', component: SourcePanel },
  { id: 'device', label: 'Device', component: DevicePanel },
  { id: 'background', label: 'Background', component: BackgroundPanel },
  { id: 'overlay', label: 'Overlays', component: OverlayPanel },
  { id: 'export', label: 'Export', component: ExportPanel }
]

export default function Sidebar() {
  const [expandedPanel, setExpandedPanel] = useState<PanelId>('device')
  const { user } = useAppStore()
  const navigate = useNavigate()

  const togglePanel = (id: PanelId) => {
    setExpandedPanel(expandedPanel === id ? id : id)
  }

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-white">
      <div className="flex-1 overflow-y-auto">
        {panels.map(({ id, label, component: Component }) => (
          <div key={id} className="border-b border-border">
            <button
              onClick={() => togglePanel(id)}
              className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary hover:text-primary transition-colors"
            >
              {label}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={`transition-transform duration-150 ${expandedPanel === id ? 'rotate-180' : ''}`}
              >
                <path d="M3 5l3 3 3-3" />
              </svg>
            </button>
            <div
              className="overflow-hidden transition-all duration-180 ease-out"
              style={{
                maxHeight: expandedPanel === id ? '2000px' : '0',
                opacity: expandedPanel === id ? 1 : 0
              }}
            >
              <div className="px-4 pb-4">
                <Component />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom: user info + upgrade */}
      <div className="border-t border-border p-4">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-xs font-medium">
              {user.full_name?.[0]?.toUpperCase() ?? user.email[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-xs font-medium text-primary">
                {user.full_name ?? user.email}
              </div>
            </div>
            <Badge plan={user.plan} />
          </div>
        ) : (
          <div className="text-xs text-text-tertiary">Guest mode</div>
        )}
        {(!user || user.plan === 'free') && (
          <button
            onClick={() => navigate('/upgrade')}
            className="mt-2 w-full rounded-lg border border-border py-1.5 text-xs font-medium text-text-secondary hover:border-primary/20 hover:text-primary transition-colors"
          >
            Upgrade to Pro
          </button>
        )}
      </div>
    </div>
  )
}
