import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/useProjectStore'
import { useCanvasStore } from '../store/useCanvasStore'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { formatDate } from '../lib/utils'

export default function Home() {
  const navigate = useNavigate()
  const { projects, fetchProjects, removeProject, setCurrentProject } = useProjectStore()
  const { setDevice, setDeviceVariant, setBackground, setDeviceShadow, setScreenshotCornerRadius, addOverlay } = useCanvasStore()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'updated' | 'name'>('updated')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleOpenProject = (project: typeof projects[number]) => {
    setCurrentProject(project)
    // Restore canvas state from project config
    const config = project.canvas_config
    if (config) {
      setDevice(config.deviceId)
      setDeviceVariant(config.deviceVariant)
      setBackground(config.background)
      if (config.deviceShadow !== undefined) setDeviceShadow(config.deviceShadow)
      setScreenshotCornerRadius(config.screenshotCornerRadius ?? null)
      // Restore overlays
      const store = useCanvasStore.getState()
      // Clear existing overlays first
      store.overlays.forEach((o) => store.removeOverlay(o.id))
      config.overlays?.forEach((o) => addOverlay(o))
    }
    navigate('/editor')
  }

  const handleDeleteProject = async () => {
    if (deleteTarget) {
      await removeProject(deleteTarget)
      setDeleteTarget(null)
    }
  }

  const filteredProjects = projects
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-primary">Welcome to Frameup</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Create beautiful device mockups and marketing visuals
            </p>
          </div>
          <Button onClick={() => navigate('/capture')}>New capture</Button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col gap-8">
            {/* Empty state */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
              <div className="mb-4">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
                  <rect x="6" y="10" width="36" height="28" rx="4" />
                  <circle cx="18" cy="22" r="4" />
                  <path d="M6 34l10-8 6 4 10-10 10 8" />
                </svg>
              </div>
              <h3 className="mb-1 text-sm font-medium text-primary">No projects yet</h3>
              <p className="mb-6 text-sm text-text-secondary">
                Capture a screenshot to get started
              </p>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/capture?source=url')}>Capture URL</Button>
                <Button variant="secondary" onClick={() => navigate('/capture?source=upload')}>Upload image</Button>
              </div>
            </div>

          </div>
        ) : (
          <div>
            {/* Search & sort bar */}
            <div className="mb-4 flex items-center gap-3">
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'updated' | 'name')}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-secondary"
              >
                <option value="updated">Last modified</option>
                <option value="name">Name</option>
              </select>
            </div>

            <h2 className="mb-4 text-sm font-medium text-text-secondary">
              {search ? `Results for "${search}"` : 'Recent projects'}
            </h2>

            <div className="grid grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="group cursor-pointer rounded-xl border border-border bg-white transition-all duration-120 hover:border-primary/20 hover:shadow-sm"
                >
                  {/* Thumbnail */}
                  <div
                    className="aspect-video rounded-t-xl bg-surface bg-cover bg-center"
                    style={project.thumbnail ? { backgroundImage: `url(${project.thumbnail})` } : undefined}
                    onClick={() => handleOpenProject(project)}
                  />
                  <div className="flex items-center justify-between p-3">
                    <div className="min-w-0 flex-1" onClick={() => handleOpenProject(project)}>
                      <h3 className="truncate text-sm font-medium text-primary">
                        {project.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        {formatDate(project.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(project.id)
                      }}
                      className="ml-2 rounded p-1 text-text-tertiary opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                      title="Delete project"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M11 4v7.5a1 1 0 01-1 1H4a1 1 0 01-1-1V4" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="py-12 text-center text-sm text-text-tertiary">
                No projects match your search
              </div>
            )}

          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete project"
      >
        <p className="mb-6 text-sm text-text-secondary">
          Are you sure you want to delete this project? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteProject} className="flex-1">
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
