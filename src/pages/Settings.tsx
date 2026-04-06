import { useState, useEffect } from 'react'
import Button from '../components/ui/Button'
import { toast } from '../components/layout/Toaster'

const shortcuts = [
  { keys: ['Cmd/Ctrl', 'S'], action: 'Save project' },
  { keys: ['Cmd/Ctrl', '0'], action: 'Fit to viewport' },
  { keys: ['Cmd/Ctrl', '1'], action: 'Zoom to 100%' },
  { keys: ['Cmd/Ctrl', 'Scroll'], action: 'Zoom in/out' },
  { keys: ['Delete/Backspace'], action: 'Delete selected overlay' },
  { keys: ['Escape'], action: 'Deselect overlay' },
]

export default function Settings() {
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [dataDir, setDataDir] = useState('')
  const [pickingDir, setPickingDir] = useState(false)
  const [pendingRestart, setPendingRestart] = useState(false)

  useEffect(() => {
    window.frameup.appSettings.get().then((result) => {
      if (result.success && result.data) setDataDir(result.data.dataDirectory)
    })
  }, [])

  const handlePickDir = async () => {
    setPickingDir(true)
    const result = await window.frameup.appSettings.pickDirectory()
    setPickingDir(false)
    if (result.success && result.data?.path) {
      await window.frameup.appSettings.set({ dataDirectory: result.data.path })
      setDataDir(result.data.path)
      setPendingRestart(true)
      toast.info('Data directory updated. Restart the app to apply changes.')
    }
  }

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true)
    try {
      const result = await window.frameup.updater.checkForUpdates()
      if (result.success) {
        toast.info('Checking for updates...')
      } else {
        toast.info(result.error ?? 'No updates available')
      }
    } catch {
      toast.info('Auto-updater not available in development')
    }
    setCheckingUpdate(false)
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-8 text-xl font-medium text-primary">Settings</h1>

        {/* Appearance */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium text-text-secondary uppercase tracking-wide">
            Appearance
          </h2>
          <div className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-primary">Theme</div>
                <div className="text-xs text-text-secondary">Dark mode coming in a future update</div>
              </div>
              <div className="flex rounded-lg border border-border">
                <button className="rounded-l-lg bg-primary px-3 py-1.5 text-xs text-white">
                  Light
                </button>
                <button className="px-3 py-1.5 text-xs text-text-tertiary cursor-not-allowed" disabled title="Coming soon">
                  Dark
                </button>
                <button className="rounded-r-lg px-3 py-1.5 text-xs text-text-tertiary cursor-not-allowed" disabled title="Coming soon">
                  System
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Keyboard shortcuts */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium text-text-secondary uppercase tracking-wide">
            Keyboard shortcuts
          </h2>
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            {shortcuts.map((s, i) => (
              <div
                key={s.action}
                className={`flex items-center justify-between px-4 py-2.5 ${
                  i < shortcuts.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <span className="text-xs text-text-secondary">{s.action}</span>
                <div className="flex gap-1">
                  {s.keys.map((key) => (
                    <kbd
                      key={key}
                      className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Storage */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium text-text-secondary uppercase tracking-wide">
            Storage
          </h2>
          <div className="rounded-xl border border-border bg-white p-4 space-y-3">
            <div>
              <div className="text-sm font-medium text-primary mb-1">Data directory</div>
              <div className="text-xs text-text-secondary font-mono break-all">{dataDir}</div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={pickingDir}
              onClick={handlePickDir}
            >
              Choose folder
            </Button>
            {pendingRestart && (
              <p className="text-xs text-amber-600">Restart the app to apply the new data directory.</p>
            )}
          </div>
        </section>

        {/* About */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium text-text-secondary uppercase tracking-wide">
            About
          </h2>
          <div className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-primary">Frameup Free</span>
              <span className="text-xs text-text-tertiary">v0.9 Beta</span>
            </div>
            <button
              onClick={() => window.frameup.shell.openExternal('https://github.com/amirmun99/FrameUp-Free')}
              className="mb-3 text-xs text-text-secondary hover:text-primary underline transition-colors"
            >
              View on GitHub
            </button>
            <Button
              variant="secondary"
              size="sm"
              loading={checkingUpdate}
              onClick={handleCheckUpdate}
              className="w-full"
            >
              Check for updates
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
