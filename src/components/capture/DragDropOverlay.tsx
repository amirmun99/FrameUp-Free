import { useState, useEffect, useCallback } from 'react'
import { useCanvasStore } from '../../store/useCanvasStore'
import { suggestDeviceFromAspectRatio } from '../../lib/devices'
import { toast } from '../layout/Toaster'
import { useNavigate } from 'react-router-dom'

export default function DragDropOverlay() {
  const [dragging, setDragging] = useState(false)
  const { setScreenshot, setDevice } = useCanvasStore()
  const navigate = useNavigate()

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer?.types.includes('Files')) {
      setDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    if (e.relatedTarget === null) {
      setDragging(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer?.files[0]
      if (!file || !file.type.startsWith('image/')) return

      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')

        const img = new Image()
        img.onload = async () => {
          const suggested = suggestDeviceFromAspectRatio(img.width, img.height)
          setDevice(suggested.id)
          setScreenshot(base64, img.width, img.height)
          try {
            await window.frameup.library.add({
              base64,
              width: img.width,
              height: img.height,
              sourceType: 'upload',
              sourceLabel: file?.name ?? 'Dropped image',
              userId: ''
            })
          } catch {
            console.warn('[library] Failed to save capture')
          }
          toast.success('Image uploaded')
          navigate('/editor')
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    },
    [setScreenshot, setDevice, navigate]
  )

  useEffect(() => {
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)
    return () => {
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [handleDragOver, handleDragLeave, handleDrop])

  if (!dragging) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="rounded-2xl border-2 border-dashed border-primary p-16 text-center">
        <p className="text-lg font-medium text-primary">Drop image to capture</p>
        <p className="mt-1 text-sm text-text-secondary">PNG, JPG, WebP</p>
      </div>
    </div>
  )
}
