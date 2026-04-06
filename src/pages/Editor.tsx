import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/sidebar/Sidebar'
import CanvasStage from '../components/canvas/CanvasStage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { useCanvasStore } from '../store/useCanvasStore'
import { useProjectStore } from '../store/useProjectStore'
import { useAppStore } from '../store/useAppStore'
import { toast } from '../components/layout/Toaster'

export default function Editor() {
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)

  const { user } = useAppStore()
  const { currentProject, projects, saveProject, updateProject, setCurrentProject } = useProjectStore()
  const { getCanvasConfig, markSaved, hasUnsavedChanges } = useCanvasStore()

  const handleSave = useCallback(async () => {
    if (!user) {
      toast.error('Sign in to save projects')
      return
    }
    if (saving) return

    if (currentProject) {
      // Update existing project
      setSaving(true)
      const config = getCanvasConfig()

      // Generate thumbnail
      const thumbnail = window.__canvasExport?.(0.3) as string | null ?? null

      await updateProject(currentProject.id, {
        canvas_config: config,
        thumbnail_url: thumbnail
      })
      markSaved()
      setSaving(false)
      toast.success('Project saved')
    } else {
      // Show name modal for new project
      setProjectName('')
      setShowSaveModal(true)
    }
  }, [user, currentProject, getCanvasConfig, updateProject, saving])

  const handleSaveNew = async () => {
    if (!projectName.trim() || !user) return

    // Check for duplicate project name
    const duplicate = projects.find(
      (p) => p.name.toLowerCase() === projectName.trim().toLowerCase()
    )
    if (duplicate) {
      setNameError('A project with this name already exists')
      return
    }

    setSaving(true)
    setNameError('')
    const config = getCanvasConfig()

    // Generate thumbnail
    const thumbnail = window.__canvasExport?.(0.3) as string | null ?? null

    const saved = await saveProject({
      user_id: user.id,
      name: projectName.trim(),
      source_type: 'url',
      source_data: {},
      canvas_config: config,
      thumbnail_url: thumbnail
    })

    if (saved) {
      setCurrentProject(saved)
      markSaved()
      toast.success('Project saved')
    } else {
      toast.error('Failed to save project')
    }
    setSaving(false)
    setShowSaveModal(false)
  }

  // Cmd/Ctrl+S shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="relative flex-1 overflow-hidden bg-surface">
        <CanvasStage />
        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-white border border-border px-3 py-1.5 text-xs font-medium text-primary shadow-sm hover:bg-surface transition-colors disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11.5 12.5h-9a1 1 0 01-1-1v-9a1 1 0 011-1h7l3 3v7a1 1 0 01-1 1z" />
            <path d="M9.5 12.5v-4h-5v4" />
            <path d="M4.5 1.5v3h4" />
          </svg>
          {saving ? 'Saving...' : 'Save project'}
        </button>
      </div>

      {/* Save as modal */}
      <Modal open={showSaveModal} onClose={() => setShowSaveModal(false)} title="Save project">
        <div className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              placeholder="Project name"
              value={projectName}
              onChange={(e) => { setProjectName(e.target.value); setNameError('') }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNew()
              }}
              autoFocus
              className={`w-full rounded-lg border px-3 py-2 text-sm text-primary placeholder:text-text-tertiary focus:outline-none ${
                nameError ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'
              }`}
            />
            {nameError && (
              <p className="mt-1 text-xs text-danger">{nameError}</p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowSaveModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveNew} loading={saving} disabled={!projectName.trim()} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
