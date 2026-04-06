import { create } from 'zustand'
import type { Project } from '../types'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean

  // Actions — fetchProjects accepts an optional userId for backward compat (ignored)
  fetchProjects: (_userId?: string) => Promise<void>
  saveProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<Project | null>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  removeProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project | null) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  fetchProjects: async (_userId?: string) => {
    set({ isLoading: true })
    const result = await window.frameup.projects.list()
    if (result.success && result.data) {
      set({ projects: result.data as Project[], isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },

  saveProject: async (project) => {
    const result = await window.frameup.projects.save(project)
    if (result.success && result.data) {
      const saved = result.data as Project
      set((state) => ({ projects: [saved, ...state.projects] }))
      return saved
    }
    return null
  },

  updateProject: async (id, updates) => {
    const result = await window.frameup.projects.update(id, updates)
    if (result.success) {
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        currentProject:
          state.currentProject?.id === id
            ? { ...state.currentProject, ...updates }
            : state.currentProject
      }))
    }
  },

  removeProject: async (id) => {
    const result = await window.frameup.projects.remove(id)
    if (result.success) {
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject
      }))
    }
  },

  setCurrentProject: (project) => set({ currentProject: project })
}))
