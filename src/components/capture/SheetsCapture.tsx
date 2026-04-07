import { useState, useEffect, useCallback } from 'react'
import Button from '../ui/Button'
import { useCanvasStore } from '../../store/useCanvasStore'
import { suggestDeviceFromAspectRatio } from '../../lib/devices'
import { toast } from '../layout/Toaster'

interface Sheet {
  id: string
  name: string
  modifiedTime: string
  url: string
}

interface SheetsCaptureProps {
  onComplete: () => void
}

export default function SheetsCapture({ onComplete }: SheetsCaptureProps) {
  const [connected, setConnected] = useState(false)
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [loading, setLoading] = useState(true)
  const [capturing, setCapturing] = useState<string | null>(null)
  const { setScreenshot, setDevice } = useCanvasStore()

  const loadSheets = useCallback(async () => {
    try {
      const result = await window.frameup.sheets.list()
      if (result.success && result.data) {
        setSheets(result.data)
      } else if (result.error?.includes('expired') || result.error?.includes('reconnect')) {
        setConnected(false)
        setSheets([])
        toast.error('Google session expired. Please reconnect.')
      }
    } catch {
      toast.error('Failed to load spreadsheets')
    }
  }, [])

  useEffect(() => {
    const check = async () => {
      setLoading(true)
      try {
        const result = await window.frameup.sheets.isConnected()
        if (result.success && result.data) {
          setConnected(true)
          await loadSheets()
        }
      } catch {
        // Not connected
      }
      setLoading(false)
    }
    check()
  }, [loadSheets])

  // Listen for OAuth callback (local server exchanges the code, then signals success/error)
  useEffect(() => {
    const handler = async (_event: unknown, status: string) => {
      if (status === 'success') {
        setConnected(true)
        await loadSheets()
        toast.success('Connected to Google Sheets')
      } else {
        toast.error('Failed to connect to Google Sheets')
      }
    }
    window.frameup.sheets.onCallback(handler)
    return () => {
      window.frameup.sheets.removeCallback(handler)
    }
  }, [loadSheets])

  const handleConnect = async () => {
    try {
      const result = await window.frameup.sheets.auth()
      if (!result.success) {
        if (result.error?.includes('not configured')) {
          toast.error('Google Sheets integration not configured. Check your environment variables.')
        } else {
          toast.error(result.error ?? 'Failed to start Google OAuth')
        }
      }
    } catch {
      toast.error('Failed to connect to Google Sheets')
    }
  }

  const handleDisconnect = async () => {
    try {
      await window.frameup.sheets.disconnect()
      setConnected(false)
      setSheets([])
      toast.success('Disconnected from Google Sheets')
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  const handleCapture = async (sheet: Sheet) => {
    setCapturing(sheet.id)
    try {
      const result = await window.frameup.sheets.capture(sheet.id)
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
              sourceType: 'sheets',
              sourceLabel: sheet.name,
              userId: ''
            })
          } catch {
            console.warn('[library] Failed to save capture')
          }
          toast.success('Sheet captured')
          setCapturing(null)
          onComplete()
        }
        img.onerror = () => {
          toast.error('Failed to decode captured image')
          setCapturing(null)
        }
        img.src = `data:image/png;base64,${result.data}`
        return
      } else {
        if (result.error?.includes('expired') || result.error?.includes('reconnect')) {
          setConnected(false)
          setSheets([])
        }
        toast.error(result.error ?? 'Capture failed')
      }
    } catch {
      toast.error('Capture failed')
    }
    setCapturing(null)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <div className="text-sm text-text-secondary">Checking Google connection...</div>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="text-4xl">📊</span>
        <div>
          <div className="text-sm font-medium text-primary">Connect to Google Sheets</div>
          <div className="mt-1 text-xs text-text-secondary">
            Authorize Frameup to access your spreadsheets
          </div>
        </div>
        <Button onClick={handleConnect}>Connect Google Sheets</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium text-primary">Google Sheets</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Select a spreadsheet to capture
        </p>
      </div>

      {sheets.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-tertiary">
          No spreadsheets found
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className="flex items-center justify-between rounded-lg border border-border bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-primary">{sheet.name}</div>
                <div className="text-xs text-text-tertiary">
                  {new Date(sheet.modifiedTime).toLocaleDateString()}
                </div>
              </div>
              <Button
                size="sm"
                loading={capturing === sheet.id}
                onClick={() => handleCapture(sheet)}
              >
                Capture
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={loadSheets}
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
