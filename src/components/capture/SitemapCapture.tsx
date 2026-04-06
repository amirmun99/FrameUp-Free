import { useState, useEffect, useCallback } from 'react'
import Button from '../ui/Button'
import { useAppStore } from '../../store/useAppStore'
import { useCanvasStore } from '../../store/useCanvasStore'
import { suggestDeviceFromAspectRatio } from '../../lib/devices'
import { toast } from '../layout/Toaster'

interface SitemapCaptureProps {
  onComplete: () => void
}

export default function SitemapCapture({ onComplete }: SitemapCaptureProps) {
  const { user } = useAppStore()
  const [domain, setDomain] = useState('')
  const [urls, setUrls] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [fetching, setFetching] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [captures, setCaptures] = useState<string[]>([])
  const [viewIndex, setViewIndex] = useState(0)
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const { setScreenshot, setDevice } = useCanvasStore()

  const viewportSizes = {
    desktop: { width: 1440, height: 900 },
    mobile: { width: 390, height: 844 }
  }

  const handleFetchSitemap = async () => {
    const trimmed = domain.trim()
    if (!trimmed) return

    // Client-side domain validation
    const domainOnly = trimmed.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!domainOnly.includes('.') || /\s/.test(domainOnly)) {
      toast.error('Invalid domain format — enter something like "example.com"')
      return
    }

    setFetching(true)
    if (!window.frameup?.sitemap) {
      toast.error('Capture service unavailable — please restart the app')
      setFetching(false)
      return
    }
    try {
      const result = await window.frameup.sitemap.fetch(domain)
      if (result.success && result.data) {
        setUrls(result.data)
        setSelected(new Set(result.data.map((_, i) => i).slice(0, 10))) // Select first 10
        if (result.data.length === 0) {
          toast.info('No sitemap found — this site may not have one')
        }
      } else {
        toast.error(result.error ?? 'Failed to fetch sitemap')
      }
    } catch {
      toast.error('Could not reach this domain — check your connection')
    }
    setFetching(false)
  }

  // Register sitemap progress listener once with proper cleanup
  useEffect(() => {
    if (!window.frameup?.sitemap) return
    const handler = (_event: unknown, prog: unknown) => {
      const p = prog as { current: number; total: number }
      setProgress(p)
    }
    window.frameup.sitemap.onProgress(handler)
    return () => {
      window.frameup.sitemap.removeProgress(handler)
    }
  }, [])

  const handleCapture = async () => {
    const selectedUrls = urls.filter((_, i) => selected.has(i))
    if (selectedUrls.length === 0) {
      toast.error('Select at least one page')
      return
    }

    setCapturing(true)
    setProgress({ current: 0, total: selectedUrls.length })

    try {
      const vp = viewportSizes[viewport]
      const jobs = selectedUrls.map((url) => ({
        url,
        captureMode: 'viewport' as const,
        viewportWidth: vp.width,
        viewportHeight: vp.height
      }))

      const result = await window.frameup.sitemap.captureQueue(jobs)
      if (result.success && result.data) {
        const validCaptures = result.data.filter((c) => c.length > 0)
        setCaptures(validCaptures)

        if (validCaptures.length > 0) {
          // Save all captures to library
          const capturedUrls = urls.filter((_, i) => selected.has(i))
          const vp = viewportSizes[viewport]
          try {
            await window.frameup.library.addBatch(
              validCaptures.map((base64, i) => ({
                base64,
                width: vp.width,
                height: vp.height,
                sourceType: 'sitemap',
                sourceLabel: capturedUrls[i] ?? 'Sitemap page',
                userId: user?.id ?? ''
              }))
            )
          } catch {
            console.warn('[library] Failed to save captures')
          }
          // Load first capture onto canvas
          loadCapture(validCaptures[0])
          toast.success(`Captured ${validCaptures.length} pages`)
        } else {
          toast.error('All captures failed')
        }
      } else {
        toast.error(result.error ?? 'Capture failed')
      }
    } catch {
      toast.error('Capture failed')
    }
    setCapturing(false)
  }

  const loadCapture = (base64: string) => {
    const img = new window.Image()
    img.onload = () => {
      const suggested = suggestDeviceFromAspectRatio(img.naturalWidth, img.naturalHeight)
      setScreenshot(base64, img.naturalWidth, img.naturalHeight)
      setDevice(suggested.id)
    }
    img.src = `data:image/png;base64,${base64}`
  }

  const toggleUrl = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  // If we have captures, show navigation view
  if (captures.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-medium text-primary">Captured Pages</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {viewIndex + 1} of {captures.length} pages
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-2">
          <img
            src={`data:image/png;base64,${captures[viewIndex]}`}
            alt={`Page ${viewIndex + 1}`}
            className="w-full rounded object-contain"
            style={{ maxHeight: '300px' }}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={viewIndex === 0}
            onClick={() => {
              const idx = viewIndex - 1
              setViewIndex(idx)
              loadCapture(captures[idx])
            }}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={viewIndex === captures.length - 1}
            onClick={() => {
              const idx = viewIndex + 1
              setViewIndex(idx)
              loadCapture(captures[idx])
            }}
          >
            Next
          </Button>
          <Button size="sm" onClick={onComplete} className="ml-auto">
            Open in Editor
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium text-primary">Sitemap Scraper</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Fetch a site's sitemap and batch capture pages
        </p>
      </div>

      {/* Domain input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetchSitemap()}
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
        />
        <Button onClick={handleFetchSitemap} loading={fetching}>
          Fetch
        </Button>
      </div>

      {/* Viewport toggle */}
      <div>
        <div className="mb-1.5 text-xs text-text-secondary">Viewport</div>
        <div className="flex rounded-lg border border-border">
          <button
            onClick={() => setViewport('desktop')}
            className={`flex-1 rounded-l-lg py-1.5 text-xs font-medium transition-colors ${
              viewport === 'desktop' ? 'bg-primary text-white' : 'text-text-secondary hover:text-primary'
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`flex-1 rounded-r-lg py-1.5 text-xs font-medium transition-colors ${
              viewport === 'mobile' ? 'bg-primary text-white' : 'text-text-secondary hover:text-primary'
            }`}
          >
            Mobile
          </button>
        </div>
        <div className="mt-1 text-[10px] text-text-tertiary">
          {viewportSizes[viewport].width} x {viewportSizes[viewport].height}
        </div>
      </div>

      {/* URL list */}
      {urls.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {urls.length} pages found, {selected.size} selected
            </span>
            <button
              onClick={() => {
                if (selected.size === urls.length) setSelected(new Set())
                else setSelected(new Set(urls.map((_, i) => i)))
              }}
              className="text-xs text-primary hover:underline"
            >
              {selected.size === urls.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto rounded-lg border border-border">
            {urls.map((url, i) => (
              <label
                key={`${i}-${url}`}
                className="flex items-center gap-2 border-b border-border px-3 py-2 last:border-0 hover:bg-surface cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleUrl(i)}
                  className="rounded border-border"
                />
                <span className="truncate text-xs text-primary">{url}</span>
              </label>
            ))}
          </div>

          <Button
            onClick={handleCapture}
            loading={capturing}
            className="w-full"
          >
            {capturing
              ? `Capturing ${progress.current}/${progress.total}...`
              : `Capture ${selected.size} pages`}
          </Button>
        </>
      )}
    </div>
  )
}
