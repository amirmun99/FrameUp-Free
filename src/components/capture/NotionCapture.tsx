import { useState, useEffect, useCallback, useRef } from 'react'
import Button from '../ui/Button'
import { useAppStore } from '../../store/useAppStore'
import { useCanvasStore } from '../../store/useCanvasStore'
import { suggestDeviceFromAspectRatio } from '../../lib/devices'
import { toast } from '../layout/Toaster'
import type { NotionCaptureOptions } from '../../types'

interface NotionPage {
  id: string
  title: string
  url: string
}

interface NotionCaptureProps {
  onComplete: () => void
}

type Viewport = 'mobile' | 'tablet' | 'desktop'
type CaptureMode = 'fullpage' | 'viewport'
type ColorScheme = 'light' | 'dark'

function NotionTutorial() {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div className="w-full max-w-sm text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors"
      >
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        How does this work?
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? contentRef.current?.scrollHeight ?? 300 : 0 }}
      >
        <div className="mt-3 rounded-lg border border-border bg-surface-secondary p-3 text-xs text-text-secondary leading-relaxed">
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Click <strong>Connect Notion</strong> to open a browser window.</li>
            <li>Log in to your Notion account if prompted.</li>
            <li>Select the pages you want Frameup to access and click <strong>Allow</strong>.</li>
            <li>The browser will close automatically and your pages will appear here.</li>
            <li>Choose capture settings (viewport, theme, mode) and click <strong>Capture</strong>.</li>
          </ol>
          <p className="mt-2 text-text-tertiary">
            Frameup takes pixel-perfect screenshots of your Notion pages exactly as they appear in the browser.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function NotionCapture({ onComplete }: NotionCaptureProps) {
  const [connected, setConnected] = useState(false)
  const [pages, setPages] = useState<NotionPage[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [capturing, setCapturing] = useState<string | null>(null)

  // Settings
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [captureMode, setCaptureMode] = useState<CaptureMode>('viewport')
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light')
  const [hideNavigation, setHideNavigation] = useState(true)

  // Batch selection
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)

  const { user } = useAppStore()
  const { setScreenshot, setDevice } = useCanvasStore()

  const loadPages = useCallback(async () => {
    try {
      const result = await window.frameup.notion.listPages()
      if (result.success && result.data) {
        setPages(result.data)
      } else if (result.error?.includes('expired') || result.error?.includes('reconnect')) {
        setConnected(false)
        setPages([])
        toast.error('Notion session expired. Please reconnect.')
      }
    } catch {
      toast.error('Failed to load Notion pages')
    }
  }, [])

  useEffect(() => {
    const check = async () => {
      setLoading(true)
      if (!window.frameup?.notion) {
        setLoading(false)
        return
      }
      try {
        const result = await window.frameup.notion.isConnected()
        if (result.success && result.data) {
          setConnected(true)
          await loadPages()
        }
      } catch { /* Not connected */ }
      setLoading(false)
    }
    check()
  }, [loadPages])

  // Listen for auth callback (notion:auth sends 'success' after completing the full flow)
  useEffect(() => {
    if (!window.frameup?.notion) return
    const handler = async (_event: unknown, status: string) => {
      if (status === 'success') {
        setConnected(true)
        await loadPages()
        toast.success('Connected to Notion')
      }
    }
    window.frameup.notion.onCallback(handler)
    return () => {
      window.frameup.notion.removeCallback(handler)
    }
  }, [loadPages])

  // Listen for batch progress
  useEffect(() => {
    if (!window.frameup?.notion) return
    const handler = (_event: unknown, progress: { current: number; total: number; pageId: string }) => {
      setBatchProgress({ current: progress.current, total: progress.total })
    }
    window.frameup.notion.onBatchProgress(handler)
    return () => {
      window.frameup.notion.removeBatchProgress(handler)
    }
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const result = await window.frameup.notion.auth()
      if (result.success) {
        setConnected(true)
        await loadPages()
        toast.success('Connected to Notion')
      } else {
        if (result.error?.includes('not configured')) {
          toast.error('Notion integration not configured. Check your environment variables.')
        } else {
          toast.error(result.error ?? 'Failed to connect to Notion')
        }
      }
    } catch {
      toast.error('Failed to connect to Notion')
    }
    setConnecting(false)
  }

  const handleDisconnect = async () => {
    try {
      await window.frameup.notion.disconnect()
      setConnected(false)
      setPages([])
      setSelectedPages(new Set())
      toast.success('Disconnected from Notion')
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  const buildCaptureOptions = (page: NotionPage): NotionCaptureOptions => ({
    pageId: page.id,
    pageUrl: page.url,
    viewport,
    captureMode,
    colorScheme,
    hideNavigation
  })

  const handleCapture = async (page: NotionPage) => {
    setCapturing(page.id)
    try {
      const options = buildCaptureOptions(page)
      const result = await window.frameup.notion.capture(options)

      if (result.success && result.data) {
        const img = new window.Image()
        img.onload = async () => {
          const suggested = suggestDeviceFromAspectRatio(img.naturalWidth, img.naturalHeight)
          setScreenshot(result.data!, img.naturalWidth, img.naturalHeight)
          setDevice(suggested.id)
          try {
            await window.frameup.library.add({
              base64: result.data!,
              width: img.naturalWidth,
              height: img.naturalHeight,
              sourceType: 'notion',
              sourceLabel: page.title,
              userId: user?.id ?? ''
            })
          } catch {
            console.warn('[library] Failed to save capture')
          }
          toast.success('Page captured')
          setCapturing(null)
          onComplete()
        }
        img.onerror = () => {
          toast.error('Failed to decode captured image')
          setCapturing(null)
        }
        img.src = `data:image/png;base64,${result.data}`
        return
      } else if (result.error === 'not_connected') {
        setConnected(false)
        toast.error('Session expired. Please reconnect.')
      } else {
        toast.error(result.error ?? 'Capture failed')
      }
    } catch {
      toast.error('Capture failed')
    }
    setCapturing(null)
  }

  const handleBatchCapture = async () => {
    if (selectedPages.size === 0) return

    const selected = pages.filter((p) => selectedPages.has(p.id))
    const jobs = selected.map(buildCaptureOptions)

    setBatchProgress({ current: 0, total: jobs.length })
    try {
      const result = await window.frameup.notion.captureBatch(jobs)
      setBatchProgress(null)

      if (result.success && result.data) {
        const successes = result.data.filter((r) => r.base64)
        const failures = result.data.filter((r) => r.error)

        // Add all successful captures to library
        for (const capture of successes) {
          const page = selected.find((p) => p.id === capture.pageId)
          if (capture.base64 && page) {
            try {
              await window.frameup.library.add({
                base64: capture.base64,
                width: 0,
                height: 0,
                sourceType: 'notion',
                sourceLabel: page.title,
                userId: user?.id ?? ''
              })
            } catch { /* ignore */ }
          }
        }

        // Load the first successful capture into canvas
        if (successes.length > 0 && successes[0].base64) {
          const firstCapture = successes[0]
          const firstPage = selected.find((p) => p.id === firstCapture.pageId)
          const img = new window.Image()
          img.onload = () => {
            const suggested = suggestDeviceFromAspectRatio(img.naturalWidth, img.naturalHeight)
            setScreenshot(firstCapture.base64!, img.naturalWidth, img.naturalHeight)
            setDevice(suggested.id)
            if (firstPage) onComplete()
          }
          img.src = `data:image/png;base64,${firstCapture.base64}`
        }

        if (failures.length > 0) {
          toast.error(`${failures.length} capture(s) failed`)
        }
        if (successes.length > 0) {
          toast.success(`${successes.length} page(s) captured`)
        }
      } else if (result.error === 'not_connected') {
        setConnected(false)
        toast.error('Session expired. Please reconnect.')
      } else {
        toast.error(result.error ?? 'Batch capture failed')
      }
    } catch {
      toast.error('Batch capture failed')
    }
    setBatchProgress(null)
    setSelectedPages(new Set())
  }

  const togglePage = (id: string) => {
    setSelectedPages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set())
    } else {
      setSelectedPages(new Set(pages.map((p) => p.id)))
    }
  }

  // --- Render ---

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <div className="text-sm text-text-secondary">Checking Notion connection...</div>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="text-4xl">📝</span>
        <div>
          <div className="text-sm font-medium text-primary">Connect to Notion</div>
          <div className="mt-1 text-xs text-text-secondary">
            Sign in to Notion to access and capture your pages
          </div>
        </div>
        <Button onClick={handleConnect} loading={connecting}>
          Connect Notion
        </Button>
        <NotionTutorial />
      </div>
    )
  }

  const isBatchRunning = batchProgress !== null

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-primary">Notion Pages</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Select a page to capture as a screenshot
        </p>
      </div>

      {/* Capture settings */}
      <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          Capture Settings
        </div>

        {/* Viewport */}
        <div className="flex items-center gap-2">
          <span className="w-20 text-xs text-text-secondary">Viewport</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            {(['mobile', 'tablet', 'desktop'] as Viewport[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewport(v)}
                className={`px-3 py-1.5 text-xs capitalize transition-colors ${
                  viewport === v
                    ? 'bg-primary text-white'
                    : 'bg-white text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Capture mode */}
        <div className="flex items-center gap-2">
          <span className="w-20 text-xs text-text-secondary">Mode</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            {(['viewport', 'fullpage'] as CaptureMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setCaptureMode(m)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  captureMode === m
                    ? 'bg-primary text-white'
                    : 'bg-white text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {m === 'fullpage' ? 'Full page' : 'Viewport'}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="flex items-center gap-2">
          <span className="w-20 text-xs text-text-secondary">Theme</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            {(['light', 'dark'] as ColorScheme[]).map((s) => (
              <button
                key={s}
                onClick={() => setColorScheme(s)}
                className={`px-3 py-1.5 text-xs capitalize transition-colors ${
                  colorScheme === s
                    ? 'bg-primary text-white'
                    : 'bg-white text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Hide navigation */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hideNavigation}
            onChange={(e) => setHideNavigation(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border text-primary"
          />
          <span className="text-xs text-text-secondary">Hide Notion sidebar & toolbar</span>
        </label>
      </div>

      {/* Batch progress */}
      {isBatchRunning && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-secondary p-3">
          <div className="text-xs text-text-secondary">
            Capturing page {batchProgress.current} of {batchProgress.total}...
          </div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Page list */}
      {pages.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-tertiary">
          No pages found. Make sure pages are shared with the integration.
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {/* Select all header */}
          <div className="flex items-center gap-3 px-3 py-2">
            <input
              type="checkbox"
              checked={selectedPages.size === pages.length && pages.length > 0}
              onChange={toggleAll}
              className="h-3.5 w-3.5 rounded border-border text-primary"
              disabled={isBatchRunning}
            />
            <span className="text-xs text-text-tertiary">
              {selectedPages.size > 0 ? `${selectedPages.size} selected` : 'Select all'}
            </span>
          </div>

          {/* Page rows */}
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-white p-3"
            >
              <input
                type="checkbox"
                checked={selectedPages.has(page.id)}
                onChange={() => togglePage(page.id)}
                className="h-3.5 w-3.5 rounded border-border text-primary"
                disabled={isBatchRunning}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-primary">{page.title}</div>
              </div>
              <Button
                size="sm"
                loading={capturing === page.id}
                onClick={() => handleCapture(page)}
                disabled={isBatchRunning}
              >
                Capture
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Batch capture button */}
      {selectedPages.size > 0 && !isBatchRunning && (
        <Button onClick={handleBatchCapture}>
          Capture Selected ({selectedPages.size})
        </Button>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={loadPages}
          className="text-xs text-text-secondary hover:text-primary transition-colors"
        >
          Refresh list
        </button>
        <button
          onClick={handleDisconnect}
          className="text-xs text-red-500 hover:text-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}
