import { useEffect, useState } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { useCanvasStore } from '../../store/useCanvasStore'

export default function TitleBar() {
  const platform = window.frameup?.platform ?? 'darwin'
  const [isMaximized, setIsMaximized] = useState(false)
  const { currentProject } = useProjectStore()
  const { hasUnsavedChanges } = useCanvasStore()

  useEffect(() => {
    if (platform === 'win32') {
      window.frameup?.window.isMaximized().then(setIsMaximized)
    }
  }, [platform])

  const title = currentProject
    ? `${currentProject.name}${hasUnsavedChanges ? ' \u2022' : ''} — Frameup`
    : 'Frameup'

  return (
    <div className="drag-region flex h-9 items-center border-b border-border bg-white shrink-0">
      {/* macOS: traffic lights occupy left space, we just need the drag region */}
      {platform === 'darwin' && <div className="w-20" />}

      <div className="flex flex-1 items-center justify-center gap-2">
        <span className="text-xs font-medium text-text-secondary select-none">{title}</span>
        <span className="select-none rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
          Beta
        </span>
      </div>

      {/* Windows: custom window controls */}
      {platform === 'win32' && (
        <div className="no-drag flex items-center">
          <button
            onClick={() => window.frameup.window.minimize()}
            className="flex h-9 w-11 items-center justify-center text-text-secondary hover:bg-surface transition-colors duration-120"
          >
            <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
              <rect width="10" height="1" />
            </svg>
          </button>
          <button
            onClick={() => {
              window.frameup.window.maximize()
              setIsMaximized(!isMaximized)
            }}
            className="flex h-9 w-11 items-center justify-center text-text-secondary hover:bg-surface transition-colors duration-120"
          >
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="2" y="0" width="8" height="8" />
                <rect x="0" y="2" width="8" height="8" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="0" y="0" width="10" height="10" />
              </svg>
            )}
          </button>
          <button
            onClick={() => window.frameup.window.close()}
            className="flex h-9 w-11 items-center justify-center text-text-secondary hover:bg-danger hover:text-white transition-colors duration-120"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <line x1="0" y1="0" x2="10" y2="10" />
              <line x1="10" y1="0" x2="0" y2="10" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
