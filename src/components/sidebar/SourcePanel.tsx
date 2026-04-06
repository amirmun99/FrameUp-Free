import { useNavigate } from 'react-router-dom'
import { useCanvasStore } from '../../store/useCanvasStore'
import Button from '../ui/Button'

export default function SourcePanel() {
  const navigate = useNavigate()
  const { screenshot, screenshotMime } = useCanvasStore()

  return (
    <div className="flex flex-col gap-3">
      {screenshot ? (
        <>
          <div className="rounded-lg border border-border bg-surface p-2">
            <img
              src={`data:${screenshotMime};base64,${screenshot}`}
              alt="Current capture"
              className="w-full rounded object-contain"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => navigate('/library')}>
              Browse captures
            </Button>
            <Button variant="ghost" size="sm" onClick={() => useCanvasStore.getState().clearScreenshot()}>
              Clear
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center">
          <p className="mb-3 text-xs text-text-secondary">No screenshot captured yet</p>
          <Button size="sm" onClick={() => navigate('/capture')} className="w-full">
            Capture screenshot
          </Button>
        </div>
      )}
    </div>
  )
}
