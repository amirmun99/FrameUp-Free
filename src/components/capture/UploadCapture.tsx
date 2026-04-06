import { useRef, useState, useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useCanvasStore } from '../../store/useCanvasStore'
import { suggestDeviceFromAspectRatio } from '../../lib/devices'
import Button from '../ui/Button'
import { toast } from '../layout/Toaster'

interface UploadCaptureProps {
  onComplete: () => void
}

export default function UploadCapture({ onComplete }: UploadCaptureProps) {
  const { user } = useAppStore()
  const { setScreenshot, setDevice } = useCanvasStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (PNG, JPG, WebP)')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
        const mime = dataUrl.match(/^data:(image\/\w+);base64,/)?.[1] ?? 'image/png'

        // Get image dimensions to suggest device
        const img = new Image()
        img.onload = async () => {
          const suggested = suggestDeviceFromAspectRatio(img.width, img.height)
          setDevice(suggested.id)
          setScreenshot(base64, img.width, img.height, mime)
          try {
            const libResult = await window.frameup.library.add({
              base64,
              mime,
              width: img.width,
              height: img.height,
              sourceType: 'upload',
              sourceLabel: file.name,
              userId: user?.id ?? ''
            })
            if (!libResult.success) console.warn('[library] Save failed:', libResult.error)
          } catch (libErr) {
            console.warn('[library] Failed to save capture:', libErr)
          }
          toast.success('Image uploaded')
          onComplete()
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    },
    [setScreenshot, setDevice, onComplete]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-primary">Upload screenshot</h2>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
        }`}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-text-tertiary">
          <rect x="4" y="6" width="24" height="20" rx="3" />
          <circle cx="12" cy="14" r="3" />
          <path d="M4 22l7-6 4 3 7-7 6 5" />
        </svg>
        <p className="text-sm text-primary font-medium">
          {dragOver ? 'Drop image here' : 'Drop image or click to browse'}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">PNG, JPG, WebP</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
