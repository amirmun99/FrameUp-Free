import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useCanvasStore } from '../../store/useCanvasStore'
import { suggestDeviceFromAspectRatio } from '../../lib/devices'
import Button from '../ui/Button'
import { toast } from '../layout/Toaster'

interface LocalFileCaptureProps {
  onComplete: () => void
}

export default function LocalFileCapture({ onComplete }: LocalFileCaptureProps) {
  const { user } = useAppStore()
  const { setScreenshot, setDevice } = useCanvasStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePickFile = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await window.frameup.capture.file('')
      if (result.success && result.data) {
        const img = new Image()
        img.onload = async () => {
          const suggested = suggestDeviceFromAspectRatio(img.width, img.height)
          setDevice(suggested.id)
          setScreenshot(result.data!, img.width, img.height)
          try {
            await window.frameup.library.add({
              base64: result.data!,
              width: img.width,
              height: img.height,
              sourceType: 'local',
              sourceLabel: 'Local file',
              userId: user?.id ?? ''
            })
          } catch {
            console.warn('[library] Failed to save capture')
          }
          toast.success('File captured')
          onComplete()
        }
        img.onerror = () => {
          setError('Failed to load captured image')
          setLoading(false)
        }
        img.src = `data:image/png;base64,${result.data}`
      } else {
        if (result.error !== 'Cancelled') {
          setError(result.error ?? 'Capture failed')
        }
        setLoading(false)
      }
    } catch {
      setError('Failed to capture file')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-primary">Local file capture</h2>
      <p className="text-sm text-text-secondary">
        Select an HTML file or image from your computer. HTML files will be rendered in a browser and captured as a screenshot.
      </p>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}

      <Button onClick={handlePickFile} loading={loading} className="w-full" size="lg">
        Choose file
      </Button>

      <p className="text-xs text-text-tertiary text-center">
        Supports PNG, JPG, WebP, GIF, and HTML files
      </p>
    </div>
  )
}
