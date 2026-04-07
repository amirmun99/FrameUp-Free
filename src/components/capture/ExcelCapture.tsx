import { useRef, useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { useCanvasStore } from '../../store/useCanvasStore'
import { suggestDeviceFromAspectRatio } from '../../lib/devices'
import Button from '../ui/Button'
import { toast } from '../layout/Toaster'

interface ExcelCaptureProps {
  onComplete: () => void
}

function buildCleanCSS(): string {
  return `
    body { margin: 0; padding: 24px; background: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    table { border-collapse: collapse; width: 100%; font-size: 14px; }
    th, td { border: 1px solid #d0d5dd; padding: 8px 12px; text-align: left; }
    th { background: #f2f4f7; font-weight: 600; color: #344054; }
    tr:nth-child(even) td { background: #f9fafb; }
    td { color: #475467; }
  `
}

function buildPreserveCSS(): string {
  return `
    body { margin: 0; padding: 24px; background: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    table { border-collapse: collapse; width: 100%; font-size: 14px; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; }
  `
}

function wrapHTML(tableHtml: string, preserveFormatting: boolean): string {
  const css = preserveFormatting ? buildPreserveCSS() : buildCleanCSS()
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${css}</style></head>
<body>${tableHtml}</body></html>`
}

export default function ExcelCapture({ onComplete }: ExcelCaptureProps) {
  const { setScreenshot, setDevice } = useCanvasStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [fileName, setFileName] = useState('')
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set())
  const [sheetRanges, setSheetRanges] = useState<Record<string, { maxRow: string; maxCol: string }>>({})
  const [preserveFormatting, setPreserveFormatting] = useState(false)
  const [capturing, setCapturing] = useState(false)

  const processFile = useCallback((file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    const validExts = ['.xlsx', '.xls', '.csv']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      toast.error('Please upload an Excel file (.xlsx, .xls) or CSV')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', cellStyles: true })
        setWorkbook(wb)
        setFileName(file.name)
        setSheetNames(wb.SheetNames)
        setSelectedSheets(new Set(wb.SheetNames.slice(0, 1)))
      } catch {
        toast.error('Could not parse file — make sure it is a valid spreadsheet')
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const toggleSheet = (name: string) => {
    setSelectedSheets((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const handleCapture = async () => {
    if (!workbook || selectedSheets.size === 0) return
    setCapturing(true)

    try {
      let lastBase64 = ''
      let lastWidth = 0
      let lastHeight = 0

      for (const sheetName of selectedSheets) {
        const sheet = workbook.Sheets[sheetName]
        const range = sheetRanges[sheetName]
        let sheetRef = sheet
        // If user specified row/col limits, create a trimmed copy
        if (range && (range.maxRow || range.maxCol)) {
          const decoded = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1')
          if (range.maxRow) {
            const r = parseInt(range.maxRow, 10)
            if (!isNaN(r) && r > 0) decoded.e.r = r - 1
          }
          if (range.maxCol) {
            const c = parseInt(range.maxCol, 10)
            if (!isNaN(c) && c > 0) decoded.e.c = c - 1
          }
          sheetRef = { ...sheet, '!ref': XLSX.utils.encode_range(decoded) }
        }
        const tableHtml = XLSX.utils.sheet_to_html(sheetRef)
        const fullHtml = wrapHTML(tableHtml, preserveFormatting)

        if (!window.frameup?.excel) {
          toast.error('Capture service unavailable — please restart the app')
          setCapturing(false)
          return
        }
        const result = await window.frameup.excel.capture({ html: fullHtml })
        if (!result.success || !result.data) {
          toast.error(`Failed to capture "${sheetName}": ${result.error ?? 'Unknown error'}`)
          continue
        }

        // Get image dimensions
        const img = await new Promise<HTMLImageElement>((resolve) => {
          const i = new window.Image()
          i.onload = () => resolve(i)
          i.src = `data:image/png;base64,${result.data}`
        })

        lastBase64 = result.data
        lastWidth = img.naturalWidth
        lastHeight = img.naturalHeight

        // Save to library
        try {
          const libResult = await window.frameup.library.add({
            base64: result.data,
            mime: 'image/png',
            width: img.naturalWidth,
            height: img.naturalHeight,
            sourceType: 'excel',
            sourceLabel: `${fileName} — ${sheetName}`,
            userId: ''
          })
          if (!libResult.success) console.warn('[library] Save failed:', libResult.error)
        } catch (libErr) {
          console.warn('[library] Failed to save capture:', libErr)
        }
      }

      if (lastBase64) {
        const suggested = suggestDeviceFromAspectRatio(lastWidth, lastHeight)
        setDevice(suggested.id)
        setScreenshot(lastBase64, lastWidth, lastHeight, 'image/png')
        toast.success(`Captured ${selectedSheets.size} sheet${selectedSheets.size > 1 ? 's' : ''}`)
        onComplete()
      }
    } catch (err) {
      toast.error('Capture failed — ' + (err as Error).message)
    }

    setCapturing(false)
  }

  // File upload view
  if (!workbook) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-primary">Excel / CSV capture</h2>

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
            <rect x="6" y="4" width="20" height="24" rx="2" />
            <path d="M10 12h12M10 16h12M10 20h8" />
          </svg>
          <p className="text-sm font-medium text-primary">
            {dragOver ? 'Drop spreadsheet here' : 'Drop spreadsheet or click to browse'}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">XLSX, XLS, CSV</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  // Sheet selection view
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium text-primary">Excel / CSV capture</h2>
        <p className="mt-1 text-sm text-text-secondary">{fileName}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-secondary">Select sheets to capture</label>
        {sheetNames.map((name) => {
          const isSelected = selectedSheets.has(name)
          const rangeVal = sheetRanges[name] ?? { maxRow: '', maxCol: '' }
          return (
            <div key={name} className="rounded-lg border border-border bg-white transition-colors hover:border-primary/20">
              <label className="flex cursor-pointer items-center gap-3 p-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSheet(name)}
                  className="h-4 w-4 rounded border-border text-primary accent-primary"
                />
                <span className="text-sm text-primary">{name}</span>
              </label>
              {isSelected && (
                <div className="flex items-center gap-3 border-t border-border px-3 py-2">
                  <span className="text-xs text-text-tertiary">Limit to</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="rows"
                    value={rangeVal.maxRow}
                    onChange={(e) => setSheetRanges((prev) => ({
                      ...prev,
                      [name]: { ...prev[name], maxRow: e.target.value, maxCol: prev[name]?.maxCol ?? '' }
                    }))}
                    className="w-20 rounded border border-border bg-surface px-2 py-1 text-xs text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
                  />
                  <span className="text-xs text-text-tertiary">rows</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="cols"
                    value={rangeVal.maxCol}
                    onChange={(e) => setSheetRanges((prev) => ({
                      ...prev,
                      [name]: { maxRow: prev[name]?.maxRow ?? '', maxCol: e.target.value }
                    }))}
                    className="w-20 rounded border border-border bg-surface px-2 py-1 text-xs text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
                  />
                  <span className="text-xs text-text-tertiary">cols</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={preserveFormatting}
            onChange={(e) => setPreserveFormatting(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary accent-primary"
          />
          Preserve formatting
        </label>
        <span className="text-xs text-text-tertiary">
          {preserveFormatting ? 'Keeps original cell styles' : 'Clean minimal table styling'}
        </span>
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => { setWorkbook(null); setSheetNames([]); setSelectedSheets(new Set()) }}
          className="flex-1"
        >
          Choose different file
        </Button>
        <Button
          onClick={handleCapture}
          loading={capturing}
          disabled={selectedSheets.size === 0}
          className="flex-1"
        >
          Capture {selectedSheets.size} sheet{selectedSheets.size !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  )
}
