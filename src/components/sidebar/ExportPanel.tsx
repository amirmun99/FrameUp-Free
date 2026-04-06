import { useState } from 'react'
import Button from '../ui/Button'
import { toast } from '../layout/Toaster'
import { exportPacks } from '../../lib/exportPacks'
import type { ExportSize } from '../../lib/exportPacks'

export default function ExportPanel() {
  const [exporting, setExporting] = useState(false)
  const [selectedPack, setSelectedPack] = useState<string | null>(null)
  const [selectedSizes, setSelectedSizes] = useState<Set<number>>(new Set())
  const [batchExporting, setBatchExporting] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })

  const [format, setFormat] = useState<'png' | 'webp'>('png')

  const setExportMime = (fmt: 'png' | 'webp') => {
    window.__canvasExportMime = fmt === 'webp' ? 'image/webp' : 'image/png'
  }

  const getCanvasExport = () => window.__canvasExport

  const handleExport = async () => {
    setExporting(true)
    try {
      const exportFn = getCanvasExport()
      if (!exportFn) {
        toast.error('No canvas to export')
        setExporting(false)
        return
      }

      setExportMime(format)
      const dataURL = exportFn(2)
      if (!dataURL) {
        toast.error('Export failed — canvas is empty')
        setExporting(false)
        return
      }

      const base64 = (dataURL as string).replace(/^data:image\/\w+;base64,/, '')

      const result = await window.frameup.export.png({
        base64,
        filename: `frameup-export-${Date.now()}.${format}`,
        format
      })

      if (!result.success) {
        if (result.error !== 'Cancelled') toast.error(result.error ?? 'Export failed')
      } else {
        toast.success('Exported successfully')
      }
    } catch {
      toast.error('Export failed')
    }
    setExporting(false)
  }

  const handleBatchExport = async () => {
    const pack = exportPacks.find((p) => p.id === selectedPack)
    if (!pack) return

    const sizes = pack.sizes.filter((_, i) => selectedSizes.has(i))
    if (sizes.length === 0) {
      toast.error('Select at least one size')
      return
    }

    setBatchExporting(true)
    setBatchProgress({ current: 0, total: sizes.length })

    try {
      const exportFn = getCanvasExport()
      if (!exportFn) {
        toast.error('No canvas to export')
        setBatchExporting(false)
        return
      }

      // Generate exports at each target size (async for device overrides)
      setExportMime(format)
      const jobs = []
      for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i]
        setBatchProgress({ current: i + 1, total: sizes.length })
        const result = exportFn(size.width, size.height, size.deviceId)
        const dataURL = result instanceof Promise ? await result : result
        const base64 = dataURL?.replace(/^data:image\/\w+;base64,/, '') ?? ''
        jobs.push({
          base64,
          filename: `${size.filename}.${format}`,
          format
        })
      }

      const result = await window.frameup.export.batch(jobs)
      if (result.success) {
        toast.success(`Exported ${sizes.length} files`)
      } else {
        if (result.error !== 'Cancelled') toast.error(result.error ?? 'Batch export failed')
      }
    } catch {
      toast.error('Batch export failed')
    }
    setBatchExporting(false)
  }

  const toggleSize = (index: number) => {
    setSelectedSizes((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const selectAllSizes = (pack: typeof exportPacks[number]) => {
    setSelectedSizes(new Set(pack.sizes.map((_, i) => i)))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Format selector */}
      <div>
        <div className="mb-2 text-xs text-text-secondary">Format</div>
        <div className="flex rounded-lg border border-border">
          <button
            onClick={() => setFormat('png')}
            className={`flex-1 rounded-l-lg py-1.5 text-xs font-medium transition-colors ${
              format === 'png' ? 'bg-primary text-white' : 'text-text-secondary hover:text-primary'
            }`}
          >
            PNG
          </button>
          <button
            onClick={() => setFormat('webp')}
            className={`flex-1 rounded-r-lg py-1.5 text-xs font-medium transition-colors ${
              format === 'webp' ? 'bg-primary text-white' : 'text-text-secondary hover:text-primary'
            }`}
          >
            WebP
          </button>
        </div>
      </div>

      {/* Single export button */}
      <Button onClick={handleExport} loading={exporting} className="w-full">
        Export Single {format.toUpperCase()}
      </Button>

      {/* Batch export */}
      <div className="border-t border-border pt-3">
        <div className="mb-2 text-xs text-text-secondary">Batch export</div>

        {/* Pack selector */}
        <div className="flex flex-col gap-1.5 mb-3">
          {exportPacks.map((pack) => (
            <button
              key={pack.id}
              onClick={() => {
                setSelectedPack(pack.id)
                selectAllSizes(pack)
              }}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                selectedPack === pack.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-surface'
              }`}
            >
              <div className="text-xs font-medium text-primary">{pack.name}</div>
              <div className="text-[10px] text-text-tertiary">{pack.description}</div>
            </button>
          ))}
        </div>

        {/* Size checklist */}
        {selectedPack && (
          <div className="mb-3">
            {exportPacks
              .find((p) => p.id === selectedPack)
              ?.sizes.map((size, i) => (
                <label
                  key={size.filename}
                  className="flex items-center gap-2 rounded px-2 py-1 hover:bg-surface cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSizes.has(i)}
                    onChange={() => toggleSize(i)}
                    className="rounded border-border"
                  />
                  <span className="text-xs text-primary">{size.label}</span>
                  <span className="text-[10px] text-text-tertiary ml-auto">
                    {size.width}x{size.height}
                  </span>
                </label>
              ))}
          </div>
        )}

        {/* Batch export button */}
        {selectedPack && (
          <Button
            variant="secondary"
            onClick={handleBatchExport}
            loading={batchExporting}
            className="w-full"
          >
            {batchExporting
              ? `Exporting ${batchProgress.current}/${batchProgress.total}...`
              : `Export ${selectedSizes.size} sizes`}
          </Button>
        )}
      </div>
    </div>
  )
}
