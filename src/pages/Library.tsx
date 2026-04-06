import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCanvasStore } from '../store/useCanvasStore'
import { useAppStore } from '../store/useAppStore'
import { suggestDeviceFromAspectRatio } from '../lib/devices'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import type { CaptureEntry } from '../types'

type FilterType = 'all' | 'desktop' | 'mobile' | string
type SortOrder = 'newest' | 'oldest'

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}

const sourceLabels: Record<string, string> = {
  url: 'URL',
  upload: 'Upload',
  local: 'Local file',
  simulator: 'Simulator',
  sitemap: 'Sitemap',
  notion: 'Notion',
  sheets: 'Sheets',
  excel: 'Excel'
}

export default function Library() {
  const navigate = useNavigate()
  const { setScreenshot, setDevice } = useCanvasStore()
  const { user } = useAppStore()
  const userId = user?.id ?? ''
  const [captures, setCaptures] = useState<CaptureEntry[]>([])
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const filteredCaptures = useMemo(() => {
    let result = captures

    // Search by source_label
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.source_label.toLowerCase().includes(q))
    }

    // Filter by type
    if (activeFilter === 'desktop') {
      result = result.filter((c) => c.width > c.height)
    } else if (activeFilter === 'mobile') {
      result = result.filter((c) => c.height >= c.width)
    } else if (activeFilter !== 'all') {
      result = result.filter((c) => c.source_type === activeFilter)
    }

    // Sort
    result = [...result].sort((a, b) =>
      sortOrder === 'newest'
        ? b.captured_at - a.captured_at
        : a.captured_at - b.captured_at
    )

    return result
  }, [captures, search, activeFilter, sortOrder])

  // Derive which source types exist for filter chips
  const availableSourceTypes = useMemo(() => {
    const types = new Set(captures.map((c) => c.source_type))
    return Array.from(types)
  }, [captures])

  const fetchCaptures = useCallback(async () => {
    const result = await window.frameup.library.list(userId)
    if (result.success && result.data) {
      setCaptures(result.data)
      // Load thumbnails for visible captures
      for (const capture of result.data) {
        const thumb = await window.frameup.library.getThumbnail(capture.id)
        if (thumb.success && thumb.data) {
          setThumbnails((prev) => ({
            ...prev,
            [capture.id]: `data:${thumb.data!.mime};base64,${thumb.data!.base64}`
          }))
        }
      }
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchCaptures()
  }, [fetchCaptures])

  const handleOpen = async (capture: CaptureEntry) => {
    const result = await window.frameup.library.get(capture.id, userId)
    if (result.success && result.data) {
      const suggested = suggestDeviceFromAspectRatio(result.data.width, result.data.height)
      setScreenshot(result.data.base64, result.data.width, result.data.height, result.data.mime)
      setDevice(suggested.id)
      navigate('/editor')
    }
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await window.frameup.library.remove(deleteTarget, userId)
      setDeleteTarget(null)
      setCaptures((prev) => prev.filter((c) => c.id !== deleteTarget))
    }
  }

  const handleClearAll = async () => {
    await window.frameup.library.clear(userId)
    setClearConfirm(false)
    setCaptures([])
    setThumbnails({})
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-primary">Capture Library</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {captures.length} capture{captures.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <div className="flex gap-3">
            {captures.length > 0 && (
              <Button variant="secondary" onClick={() => setClearConfirm(true)}>
                Clear all
              </Button>
            )}
            <Button onClick={() => navigate('/capture')}>New capture</Button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-text-tertiary">Loading captures...</div>
        ) : captures.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
            <div className="mb-4">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
                <rect x="6" y="10" width="36" height="28" rx="4" />
                <circle cx="18" cy="22" r="4" />
                <path d="M6 34l10-8 6 4 10-10 10 8" />
              </svg>
            </div>
            <h3 className="mb-1 text-sm font-medium text-primary">No captures yet</h3>
            <p className="mb-6 text-sm text-text-secondary">
              Screenshots you capture will appear here
            </p>
            <Button onClick={() => navigate('/capture')}>Start capturing</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Filter bar */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                    <circle cx="6" cy="6" r="4.5" />
                    <path d="M9.5 9.5L12.5 12.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search captures..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
                  />
                </div>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-secondary"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'desktop', 'mobile'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      activeFilter === filter
                        ? 'bg-primary text-white'
                        : 'bg-surface text-text-secondary hover:bg-border'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter === 'desktop' ? 'Desktop' : 'Mobile'}
                  </button>
                ))}
                {availableSourceTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(activeFilter === type ? 'all' : type)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      activeFilter === type
                        ? 'bg-primary text-white'
                        : 'bg-surface text-text-secondary hover:bg-border'
                    }`}
                  >
                    {sourceLabels[type] || type}
                  </button>
                ))}
              </div>
            </div>

            {filteredCaptures.length === 0 ? (
              <div className="py-12 text-center text-sm text-text-tertiary">
                No captures match your filters
              </div>
            ) : (
            <div className="grid grid-cols-3 gap-4">
            {filteredCaptures.map((capture) => (
              <div
                key={capture.id}
                className="group cursor-pointer rounded-xl border border-border bg-white transition-all duration-120 hover:border-primary/20 hover:shadow-sm"
              >
                <div
                  className="aspect-video rounded-t-xl bg-surface bg-cover bg-center"
                  style={thumbnails[capture.id] ? { backgroundImage: `url(${thumbnails[capture.id]})` } : undefined}
                  onClick={() => handleOpen(capture)}
                />
                <div className="flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1" onClick={() => handleOpen(capture)}>
                    <h3 className="truncate text-sm font-medium text-primary">
                      {capture.source_label || sourceLabels[capture.source_type] || 'Capture'}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-text-tertiary">
                      <span>{capture.width} x {capture.height}</span>
                      <span>{relativeTime(capture.captured_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(capture.id)
                    }}
                    className="ml-2 rounded p-1 text-text-tertiary opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                    title="Delete capture"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M11 4v7.5a1 1 0 01-1 1H4a1 1 0 01-1-1V4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete capture">
        <p className="mb-6 text-sm text-text-secondary">
          Are you sure you want to delete this capture? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
        </div>
      </Modal>

      {/* Clear all confirmation */}
      <Modal open={clearConfirm} onClose={() => setClearConfirm(false)} title="Clear all captures">
        <p className="mb-6 text-sm text-text-secondary">
          This will permanently delete all {captures.length} captures. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setClearConfirm(false)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleClearAll} className="flex-1">Clear all</Button>
        </div>
      </Modal>
    </div>
  )
}
