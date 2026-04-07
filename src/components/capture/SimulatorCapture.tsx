import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import { useCanvasStore } from '../../store/useCanvasStore'
import { suggestDeviceFromAspectRatio, getDeviceById } from '../../lib/devices'
import { toast } from '../layout/Toaster'
import type { SimulatorDevice } from '../../types'

interface SimulatorCaptureProps {
  onComplete: () => void
}

function HelpSection() {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-primary">iOS Simulator</h2>
          <button
            onClick={() => setShowHelp((v) => !v)}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="6" />
              <path d="M5.5 5.5a1.5 1.5 0 112.12 1.37c-.42.24-.62.53-.62.88V8.5" strokeLinecap="round" />
              <circle cx="7" cy="10.5" r="0.5" fill="currentColor" stroke="none" />
            </svg>
            {showHelp ? 'Hide help' : 'How to use'}
          </button>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Capture a screenshot from a running simulator
        </p>
      </div>

      {showHelp && (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm text-text-secondary">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Open <strong className="text-primary">Xcode</strong> and launch an iOS Simulator</li>
            <li>Navigate to the screen you want to capture in the Simulator</li>
            <li>Select the device from the list below and click <strong className="text-primary">Capture</strong></li>
          </ol>
          <p className="mt-3 text-xs text-text-tertiary">
            Requires macOS with Xcode installed. Only booted simulators appear in the list.
          </p>
        </div>
      )}
    </>
  )
}

export default function SimulatorCapture({ onComplete }: SimulatorCaptureProps) {
  const [simulators, setSimulators] = useState<SimulatorDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [capturing, setCapturing] = useState<string | null>(null)
  const { setScreenshot, setDevice } = useCanvasStore()

  useEffect(() => {
    loadSimulators()
  }, [])

  const loadSimulators = async () => {
    setLoading(true)
    try {
      const result = await window.frameup.capture.simulator.list()
      if (result.success && result.data) {
        setSimulators(result.data)
      } else {
        toast.error(result.error ?? 'Failed to list simulators')
      }
    } catch {
      toast.error('Failed to connect to Simulator')
    }
    setLoading(false)
  }

  const handleCapture = async (device: SimulatorDevice) => {
    setCapturing(device.udid)
    try {
      const result = await window.frameup.capture.simulator.capture(device.udid)
      if (result.success && result.data) {
        const img = new window.Image()
        img.onload = async () => {
          const suggested = suggestDeviceFromAspectRatio(img.naturalWidth, img.naturalHeight)
          // For Dynamic Island devices, auto-select the no-cutout variant so the
          // screenshot's own Dynamic Island shows naturally without a duplicate
          // from the device frame artwork.
          const noCutoutId = `${suggested.id}-no-cutout`
          const noCutoutDevice = getDeviceById(noCutoutId)
          const deviceId = noCutoutDevice ? noCutoutId : suggested.id
          setScreenshot(result.data!, img.naturalWidth, img.naturalHeight)
          setDevice(deviceId)
          try {
            await window.frameup.library.add({
              base64: result.data!,
              width: img.naturalWidth,
              height: img.naturalHeight,
              sourceType: 'simulator',
              sourceLabel: device.name,
              userId: ''
            })
          } catch {
            console.warn('[library] Failed to save capture')
          }
          toast.success('Screenshot captured')
          onComplete()
        }
        img.src = `data:image/png;base64,${result.data}`
      } else {
        toast.error(result.error ?? 'Capture failed')
      }
    } catch {
      toast.error('Capture failed')
    }
    setCapturing(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <HelpSection />

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <div className="text-sm text-text-secondary">Scanning for simulators...</div>
        </div>
      ) : simulators.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-12 text-center">
          <span className="text-4xl">📱</span>
          <div>
            <div className="text-sm font-medium text-primary">No simulators running</div>
            <div className="mt-1 text-xs text-text-secondary">
              Open Xcode and boot an iOS Simulator, then come back here.
            </div>
          </div>
          <Button variant="secondary" onClick={loadSimulators}>
            Refresh
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {simulators.map((sim) => (
              <div
                key={sim.udid}
                className="flex items-center justify-between rounded-lg border border-border bg-white p-3"
              >
                <div>
                  <div className="text-sm font-medium text-primary">{sim.name}</div>
                  <div className="text-xs text-text-secondary">{sim.runtime}</div>
                </div>
                <Button
                  size="sm"
                  loading={capturing === sim.udid}
                  onClick={() => handleCapture(sim)}
                >
                  Capture
                </Button>
              </div>
            ))}
          </div>

          <button
            onClick={loadSimulators}
            className="text-xs text-text-secondary hover:text-primary transition-colors"
          >
            Refresh list
          </button>
        </>
      )}
    </div>
  )
}
