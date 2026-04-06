import { useState } from 'react'
import { useCanvasStore } from '../../store/useCanvasStore'
import { generateId } from '../../lib/utils'
import type { Overlay } from '../../types'

const badgeOptions = [
  { type: 'app-store' as const, name: 'App Store', src: '/assets/badges/app-store.svg', w: 120, h: 40 },
  { type: 'play-store' as const, name: 'Play Store', src: '/assets/badges/play-store.svg', w: 135, h: 40 },
  { type: 'mac-app-store' as const, name: 'Mac App Store', src: '/assets/badges/mac-app-store.svg', w: 156, h: 40 },
  { type: 'product-hunt' as const, name: 'Product Hunt', src: '/assets/badges/product-hunt.svg', w: 200, h: 43 },
]

const fontOptions = [
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier', value: '"Courier New", Courier, monospace' },
  { label: 'Times', value: '"Times New Roman", Times, serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet', value: '"Trebuchet MS", sans-serif' },
  { label: 'Impact', value: 'Impact, sans-serif' },
]

export default function OverlayPanel() {
  const { overlays, addOverlay, updateOverlay, removeOverlay } = useCanvasStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAddText = () => {
    const overlay: Overlay = {
      id: generateId(),
      type: 'text',
      x: 100,
      y: 40,
      width: 300,
      height: 40,
      rotation: 0,
      text: 'Your headline here',
      fontSize: 24,
      fontWeight: 700,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#FFFFFF',
      align: 'center'
    }
    addOverlay(overlay)
    setEditingId(overlay.id)
  }

  const handleAddBadge = (badge: typeof badgeOptions[number]) => {
    const overlay: Overlay = {
      id: generateId(),
      type: 'badge',
      x: 100,
      y: 60,
      width: badge.w,
      height: badge.h,
      rotation: 0,
      badgeType: badge.type,
      imageSrc: badge.src
    }
    addOverlay(overlay)
  }

  const handleUploadBadge = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const img = new window.Image()
        img.onload = () => {
          const aspect = img.naturalWidth / img.naturalHeight
          const w = 120
          const h = Math.round(w / aspect)
          const overlay: Overlay = {
            id: generateId(),
            type: 'badge',
            x: 100,
            y: 60,
            width: w,
            height: h,
            rotation: 0,
            imageSrc: reader.result as string
          }
          addOverlay(overlay)
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Add text */}
      <button
        onClick={handleAddText}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm text-primary hover:bg-surface transition-colors"
      >
        <span className="text-base font-bold">T</span>
        Add text overlay
      </button>

      {/* Badges */}
      <div>
        <div className="mb-2 text-xs text-text-secondary">Store badges</div>
        <div className="grid grid-cols-2 gap-2">
          {badgeOptions.map((badge) => (
            <button
              key={badge.type}
              onClick={() => handleAddBadge(badge)}
              className="rounded-lg border border-border p-2 text-center hover:bg-surface transition-colors"
            >
              <div className="text-[10px] text-text-secondary">{badge.name}</div>
            </button>
          ))}
        </div>
        <button
          onClick={handleUploadBadge}
          className="w-full rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-secondary hover:bg-surface transition-colors"
        >
          Upload custom badge
        </button>
      </div>

      {/* Active overlays list */}
      {overlays.length > 0 && (
        <div>
          <div className="mb-2 text-xs text-text-secondary">Active overlays</div>
          <div className="flex flex-col gap-1.5">
            {overlays.map((overlay) => (
              <div key={overlay.id} className="flex flex-col rounded-lg border border-border p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">
                    {overlay.type === 'text' ? 'Text' : overlay.badgeType?.replace('-', ' ') ?? 'Badge'}
                  </span>
                  <button
                    onClick={() => removeOverlay(overlay.id)}
                    className="text-[10px] text-danger hover:text-danger/80 transition-colors"
                  >
                    Remove
                  </button>
                </div>

                {/* Text overlay controls */}
                {overlay.type === 'text' && editingId === overlay.id && (
                  <div className="mt-2 flex flex-col gap-2">
                    <input
                      type="text"
                      value={overlay.text ?? ''}
                      onChange={(e) => updateOverlay(overlay.id, { text: e.target.value })}
                      className="w-full rounded border border-border px-2 py-1 text-xs text-primary focus:border-primary focus:outline-none"
                    />
                    <select
                      value={overlay.fontFamily ?? 'Inter, system-ui, sans-serif'}
                      onChange={(e) => updateOverlay(overlay.id, { fontFamily: e.target.value })}
                      className="w-full rounded border border-border px-1 py-0.5 text-[10px] text-primary"
                    >
                      {fontOptions.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <select
                        value={overlay.fontSize ?? 24}
                        onChange={(e) => updateOverlay(overlay.id, { fontSize: Number(e.target.value) })}
                        className="flex-1 rounded border border-border px-1 py-0.5 text-[10px] text-primary"
                      >
                        {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72].map((s) => (
                          <option key={s} value={s}>{s}px</option>
                        ))}
                      </select>
                      <select
                        value={overlay.fontWeight ?? 700}
                        onChange={(e) => updateOverlay(overlay.id, { fontWeight: Number(e.target.value) })}
                        className="flex-1 rounded border border-border px-1 py-0.5 text-[10px] text-primary"
                      >
                        <option value={400}>Regular</option>
                        <option value={500}>Medium</option>
                        <option value={700}>Bold</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={overlay.fill ?? '#FFFFFF'}
                        onChange={(e) => updateOverlay(overlay.id, { fill: e.target.value })}
                        className="h-6 w-6 cursor-pointer rounded border border-border"
                      />
                      <div className="flex flex-1 rounded border border-border">
                        {(['left', 'center', 'right'] as const).map((a) => (
                          <button
                            key={a}
                            onClick={() => updateOverlay(overlay.id, { align: a })}
                            className={`flex-1 py-0.5 text-[10px] transition-colors ${
                              overlay.align === a ? 'bg-primary text-white' : 'text-text-secondary'
                            }`}
                          >
                            {a[0].toUpperCase() + a.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {overlay.type === 'text' && editingId !== overlay.id && (
                  <button
                    onClick={() => setEditingId(overlay.id)}
                    className="mt-1 text-left text-[10px] text-text-tertiary hover:text-primary transition-colors"
                  >
                    Edit properties
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
