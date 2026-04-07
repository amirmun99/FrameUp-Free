import { useState } from 'react'
import { useCanvasStore } from '../../store/useCanvasStore'
import { suggestDeviceFromAspectRatio } from '../../lib/devices'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { toast } from '../layout/Toaster'

type Viewport = 'mobile' | 'tablet' | 'desktop' | 'custom'
type CaptureMode = 'fullpage' | 'viewport' | 'selector'

const viewportSizes: Record<Exclude<Viewport, 'custom'>, { width: number; height: number }> = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 }
}

interface URLCaptureProps {
  onComplete: () => void
}

export default function URLCapture({ onComplete }: URLCaptureProps) {
  const { setScreenshot, setDevice } = useCanvasStore()
  const [url, setUrl] = useState('')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [customWidth, setCustomWidth] = useState('1440')
  const [customHeight, setCustomHeight] = useState('900')
  const [captureMode, setCaptureMode] = useState<CaptureMode>('fullpage')
  const [selector, setSelector] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [preCaptureScript, setPreCaptureScript] = useState('')
  const [delayAfterLoad, setDelayAfterLoad] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCapture = async () => {
    if (!url) return
    setLoading(true)
    setError('')

    // Guard: ensure we're running inside the Electron app (preload must inject window.frameup)
    if (!window.frameup?.capture?.url) {
      setError('Capture unavailable — make sure you\'re running via "npm run dev" in the Electron app, not a browser')
      setLoading(false)
      return
    }

    // Validate URL format
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    try {
      new URL(fullUrl)
    } catch {
      setError('Invalid URL — make sure it looks like "https://example.com"')
      setLoading(false)
      return
    }

    const vp = viewport === 'custom'
      ? { width: parseInt(customWidth) || 1440, height: parseInt(customHeight) || 900 }
      : viewportSizes[viewport]

    try {
      const result = await window.frameup.capture.url({
        url: fullUrl,
        viewportWidth: vp.width,
        viewportHeight: vp.height,
        captureMode,
        selector: captureMode === 'selector' ? selector : undefined,
        removeCookieBanners: true,
        preCaptureScript: preCaptureScript || undefined,
        delayAfterLoad: delayAfterLoad ? parseInt(delayAfterLoad) : undefined
      })

      if (result.success && result.data) {
        setScreenshot(result.data, vp.width, vp.height)
        // Auto-select a matching device based on the viewport aspect ratio
        const suggested = suggestDeviceFromAspectRatio(vp.width, vp.height)
        setDevice(suggested.id)
        try {
          const libResult = await window.frameup.library.add({
            base64: result.data,
            width: vp.width,
            height: vp.height,
            sourceType: 'url',
            sourceLabel: fullUrl,
            userId: ''
          })
          if (!libResult.success) {
            console.warn('[library] Failed to save capture:', libResult.error)
          }
        } catch (libErr) {
          console.warn('[library] Failed to save capture:', libErr)
        }
        toast.success('Screenshot captured')
        onComplete()
      } else {
        const msg = result.error ?? 'Capture failed'
        if (msg.includes('timeout') || msg.includes('Timeout')) {
          setError('Page took too long to load — try increasing the wait time in Advanced options')
        } else if (msg.includes('net::') || msg.includes('ERR_')) {
          setError('Could not load page — check the URL and try again')
        } else {
          setError(msg)
        }
      }
    } catch (err) {
      const msg = (err as Error).message ?? ''
      console.error('[URLCapture] Error:', msg)
      if (msg.includes('Executable') || msg.includes('playwright') || msg.includes('chromium')) {
        setError('Playwright browser not found — run: npx playwright install chromium')
      } else {
        setError('Could not load page — ' + (msg || 'check the URL and try again'))
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-primary">URL capture</h2>

      <Input
        placeholder="Paste a URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCapture()}
        autoFocus
        error={error}
      />

      {/* Viewport selector */}
      <div>
        <div className="mb-2 text-xs font-medium text-text-secondary">Viewport</div>
        <div className="flex rounded-lg border border-border">
          {(['mobile', 'tablet', 'desktop', 'custom'] as Viewport[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewport(v)}
              className={`flex-1 py-1.5 text-xs font-medium capitalize transition-colors ${
                viewport === v
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-primary'
              } ${v === 'mobile' ? 'rounded-l-lg' : ''} ${v === 'custom' ? 'rounded-r-lg' : ''}`}
            >
              {v}
            </button>
          ))}
        </div>
        {viewport === 'custom' && (
          <div className="mt-2 flex gap-2">
            <Input label="Width" type="number" value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} />
            <Input label="Height" type="number" value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} />
          </div>
        )}
      </div>

      {/* Capture mode */}
      <div>
        <div className="mb-2 text-xs font-medium text-text-secondary">Capture mode</div>
        <div className="flex rounded-lg border border-border">
          {(['fullpage', 'viewport', 'selector'] as CaptureMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setCaptureMode(m)}
              className={`flex-1 py-1.5 text-xs font-medium capitalize transition-colors ${
                captureMode === m
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-primary'
              } ${m === 'fullpage' ? 'rounded-l-lg' : ''} ${m === 'selector' ? 'rounded-r-lg' : ''}`}
            >
              {m === 'fullpage' ? 'Full page' : m === 'viewport' ? 'Viewport' : 'CSS selector'}
            </button>
          ))}
        </div>
        {captureMode === 'selector' && (
          <div className="mt-2">
            <Input
              placeholder='Enter selector (e.g. #hero)'
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Advanced options */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-left text-xs text-text-secondary hover:text-primary transition-colors"
      >
        {showAdvanced ? '▾' : '▸'} Advanced options
      </button>
      {showAdvanced && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
          <div>
            <label className="mb-1 block text-xs text-text-secondary">Pre-capture script</label>
            <textarea
              value={preCaptureScript}
              onChange={(e) => setPreCaptureScript(e.target.value)}
              placeholder="scroll(0, 500); click('.nav-cta');"
              className="h-16 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none"
            />
          </div>
          <Input
            label="Delay after load (ms)"
            type="number"
            placeholder="0"
            value={delayAfterLoad}
            onChange={(e) => setDelayAfterLoad(e.target.value)}
          />
        </div>
      )}

      <Button onClick={handleCapture} loading={loading} className="w-full" size="lg">
        Capture
      </Button>
    </div>
  )
}
