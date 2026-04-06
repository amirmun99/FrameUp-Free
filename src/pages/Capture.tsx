import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import URLCapture from '../components/capture/URLCapture'
import UploadCapture from '../components/capture/UploadCapture'
import LocalFileCapture from '../components/capture/LocalFileCapture'
import SimulatorCapture from '../components/capture/SimulatorCapture'
import SitemapCapture from '../components/capture/SitemapCapture'
import NotionCapture from '../components/capture/NotionCapture'
import SheetsCapture from '../components/capture/SheetsCapture'
import ExcelCapture from '../components/capture/ExcelCapture'
import { useProjectStore } from '../store/useProjectStore'
import { useCanvasStore } from '../store/useCanvasStore'
import { toast } from '../components/layout/Toaster'

type SourceType = 'url' | 'upload' | 'local' | 'simulator' | 'sitemap' | 'notion' | 'sheets' | 'excel'

interface SourceOption {
  id: SourceType
  name: string
  description: string
  icon: string
  disabled?: boolean
}

const sources: SourceOption[] = [
  { id: 'url', name: 'URL capture', description: 'Capture any website by URL', icon: '🌐' },
  { id: 'upload', name: 'Upload screenshot', description: 'Upload your own image', icon: '📤' },
  { id: 'local', name: 'Local file', description: 'Capture HTML or image file', icon: '📁' },
  { id: 'simulator', name: 'iOS Simulator', description: 'Capture from Xcode Simulator', icon: '📱' },
  { id: 'sitemap', name: 'Sitemap scraper', description: 'Batch capture entire sites', icon: '🗺️' },
  { id: 'notion', name: 'Notion', description: 'Capture Notion pages', icon: '📝' },
  { id: 'sheets', name: 'Google Sheets', description: 'Coming soon', icon: '📊', disabled: true },
  { id: 'excel', name: 'Excel / CSV', description: 'Upload and capture spreadsheets', icon: '📑' }
]

export default function Capture() {
  const [activeSource, setActiveSource] = useState<SourceType | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isMac = window.frameup?.platform === 'darwin' || navigator.userAgent.includes('Macintosh')

  // Auto-select source from query param (e.g. /capture?source=url)
  useEffect(() => {
    const source = searchParams.get('source') as SourceType | null
    if (source && sources.some((s) => s.id === source)) {
      setActiveSource(source)
    }
  }, [searchParams])

  const handleCaptureComplete = useCallback(async () => {
    const { currentProject, updateProject, setCurrentProject } = useProjectStore.getState()
    const { getCanvasConfig, markSaved } = useCanvasStore.getState()

    // If there's an existing project, auto-save it before starting fresh
    if (currentProject) {
      try {
        const config = getCanvasConfig()
        const thumbnail = window.__canvasExport?.(0.3) as string | null ?? null
        await updateProject(currentProject.id, {
          canvas_config: config,
          thumbnail_url: thumbnail
        })
        markSaved()
        toast.info(`"${currentProject.name}" auto-saved. New project created.`)
      } catch {
        toast.info('New project created.')
      }
    }

    // Clear the current project so editor treats this as a new unsaved project
    setCurrentProject(null)
    navigate('/editor')
  }, [navigate])

  if (activeSource === 'simulator') {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => setActiveSource(null)}
            className="mb-6 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ← Back to sources
          </button>
          <SimulatorCapture onComplete={handleCaptureComplete} />
        </div>
      </div>
    )
  }

  if (activeSource === 'sitemap') {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => setActiveSource(null)}
            className="mb-6 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ← Back to sources
          </button>
          <SitemapCapture onComplete={handleCaptureComplete} />
        </div>
      </div>
    )
  }

  if (activeSource === 'notion') {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => setActiveSource(null)}
            className="mb-6 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ← Back to sources
          </button>
          <NotionCapture onComplete={handleCaptureComplete} />
        </div>
      </div>
    )
  }

  if (activeSource === 'sheets') {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => setActiveSource(null)}
            className="mb-6 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ← Back to sources
          </button>
          <SheetsCapture onComplete={handleCaptureComplete} />
        </div>
      </div>
    )
  }

  if (activeSource === 'excel') {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => setActiveSource(null)}
            className="mb-6 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ← Back to sources
          </button>
          <ExcelCapture onComplete={handleCaptureComplete} />
        </div>
      </div>
    )
  }

  if (activeSource === 'url') {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => setActiveSource(null)}
            className="mb-6 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ← Back to sources
          </button>
          <URLCapture onComplete={handleCaptureComplete} />
        </div>
      </div>
    )
  }

  if (activeSource === 'upload') {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => setActiveSource(null)}
            className="mb-6 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ← Back to sources
          </button>
          <UploadCapture onComplete={handleCaptureComplete} />
        </div>
      </div>
    )
  }

  if (activeSource === 'local') {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => setActiveSource(null)}
            className="mb-6 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ← Back to sources
          </button>
          <LocalFileCapture onComplete={handleCaptureComplete} />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-medium text-primary">New capture</h1>
          <p className="mt-1 text-sm text-text-secondary">Choose a screenshot source</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {sources
            .filter((s) => s.id !== 'simulator' || isMac)
            .map((source) => {
              const isDisabled = source.disabled === true
              return (
                <button
                  key={source.id}
                  onClick={() => !isDisabled && setActiveSource(source.id)}
                  disabled={isDisabled}
                  className={`flex items-start gap-3 rounded-xl border border-border p-4 text-left transition-all duration-120 ${
                    isDisabled
                      ? 'cursor-not-allowed bg-surface-secondary opacity-50'
                      : 'bg-white hover:border-primary/20 hover:shadow-sm'
                  }`}
                >
                  <span className="text-2xl">{source.icon}</span>
                  <div>
                    <div className={`text-sm font-medium ${isDisabled ? 'text-text-tertiary' : 'text-primary'}`}>{source.name}</div>
                    <div className="mt-0.5 text-xs text-text-secondary">{source.description}</div>
                  </div>
                </button>
              )
            })}
        </div>
      </div>
    </div>
  )
}
