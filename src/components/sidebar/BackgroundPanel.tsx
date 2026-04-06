import { useState } from 'react'
import { useCanvasStore } from '../../store/useCanvasStore'
import { backgroundCategories } from '../../lib/presets'
import type { Background } from '../../types'

type CategoryId = 'gradient' | 'solid' | 'mesh' | 'transparent' | 'custom'

export default function BackgroundPanel() {
  const { background, setBackground, deviceShadow, setDeviceShadow } = useCanvasStore()
  const [activeCategory, setActiveCategory] = useState<CategoryId>('gradient')
  const [customColor1, setCustomColor1] = useState('#667eea')
  const [customColor2, setCustomColor2] = useState('#764ba2')
  const [customAngle, setCustomAngle] = useState(135)

  const applyCustomGradient = (c1: string, c2: string, angle: number) => {
    setBackground({
      type: 'gradient',
      name: 'Custom',
      value: `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 100%)`,
      colors: [c1, c2]
    })
  }

  const applyCustomSolid = (color: string) => {
    setBackground({
      type: 'solid',
      name: 'Custom',
      value: color,
      colors: [color, color]
    })
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        setBackground({
          type: 'image',
          name: file.name,
          value: dataUrl,
        })
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  // Helper to get swatch style for a preset
  const swatchStyle = (preset: Background): React.CSSProperties => {
    if (preset.type === 'transparent') {
      return {
        backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%),
          linear-gradient(-45deg, #ccc 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #ccc 75%),
          linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
        backgroundSize: '10px 10px',
        backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
      }
    }
    if (preset.type === 'solid') {
      return { backgroundColor: preset.value }
    }
    return { background: preset.value }
  }

  const categories = [
    ...backgroundCategories.map((c) => ({ id: c.id as CategoryId, label: c.label })),
    { id: 'custom' as CategoryId, label: 'Custom' }
  ]

  const activePresets = activeCategory !== 'custom'
    ? backgroundCategories.find((c) => c.id === activeCategory)?.presets ?? []
    : []

  return (
    <div className="flex flex-col gap-3">
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-surface'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Preset grid */}
      {activeCategory !== 'custom' && (
        <div className="grid grid-cols-4 gap-2">
          {activePresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setBackground(preset)}
              className={`group relative aspect-square rounded-lg border-2 transition-all duration-120 ${
                background.name === preset.name
                  ? 'border-primary scale-95'
                  : 'border-transparent hover:border-border'
              }`}
              style={swatchStyle(preset)}
              title={preset.name}
            >
              {background.name === preset.name && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l4 4 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Custom controls */}
      {activeCategory === 'custom' && (
        <div className="flex flex-col gap-3">
          {/* Custom gradient */}
          <div>
            <div className="mb-2 text-xs text-text-secondary">Custom gradient</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor1}
                onChange={(e) => {
                  setCustomColor1(e.target.value)
                  applyCustomGradient(e.target.value, customColor2, customAngle)
                }}
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
              <input
                type="color"
                value={customColor2}
                onChange={(e) => {
                  setCustomColor2(e.target.value)
                  applyCustomGradient(customColor1, e.target.value, customAngle)
                }}
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
              <div className="flex flex-1 items-center gap-1">
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={customAngle}
                  onChange={(e) => {
                    const angle = Number(e.target.value)
                    setCustomAngle(angle)
                    applyCustomGradient(customColor1, customColor2, angle)
                  }}
                  className="flex-1"
                />
                <span className="text-[10px] text-text-tertiary w-7 text-right">{customAngle}°</span>
              </div>
            </div>
          </div>

          {/* Custom solid */}
          <div>
            <div className="mb-2 text-xs text-text-secondary">Custom solid</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={background.type === 'solid' && background.name === 'Custom' ? background.value : '#3B82F6'}
                onChange={(e) => applyCustomSolid(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
              <input
                type="text"
                placeholder="#hex"
                value={background.type === 'solid' && background.name === 'Custom' ? background.value : ''}
                onChange={(e) => {
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    applyCustomSolid(e.target.value)
                  }
                }}
                className="flex-1 rounded border border-border px-2 py-1 text-xs text-primary focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Image upload */}
          <div>
            <div className="mb-2 text-xs text-text-secondary">Background image</div>
            <button
              onClick={handleImageUpload}
              className="w-full rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-secondary hover:bg-surface transition-colors"
            >
              Upload image
            </button>
          </div>
        </div>
      )}

      <div className="text-[10px] text-text-tertiary">
        {background.name}
      </div>

      {/* Effects */}
      <div className="border-t border-border pt-3">
        <div className="mb-2 text-xs text-text-secondary">Effects</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-primary">Device shadow</div>
            <div className="text-[10px] text-text-tertiary">Drop shadow behind frame</div>
          </div>
          <button
            onClick={() => setDeviceShadow(!deviceShadow)}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              deviceShadow ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                deviceShadow ? 'translate-x-4' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
