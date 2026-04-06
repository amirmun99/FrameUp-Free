import { create } from 'zustand'
import type { Background, CanvasConfig, Overlay } from '../types'
import { backgroundPresets } from '../lib/presets'

interface CanvasState {
  // Screenshot data (base64)
  screenshot: string | null
  screenshotWidth: number
  screenshotHeight: number
  screenshotMime: string

  // Screenshot position offset within the device screen (for panning)
  screenshotOffsetX: number
  screenshotOffsetY: number

  // Device
  selectedDeviceId: string
  deviceVariant: 'light' | 'dark'

  // Background
  background: Background

  // Overlays
  overlays: Overlay[]

  // Effects
  deviceShadow: boolean
  screenshotCornerRadius: number | null // null = use device default

  // Canvas viewport
  canvasWidth: number
  canvasHeight: number
  zoom: number
  stageX: number
  stageY: number

  // Unsaved changes tracking
  hasUnsavedChanges: boolean

  // Actions
  setScreenshot: (base64: string, width?: number, height?: number, mime?: string) => void
  clearScreenshot: () => void
  setScreenshotOffset: (x: number, y: number) => void
  setDevice: (deviceId: string) => void
  setDeviceVariant: (variant: 'light' | 'dark') => void
  setBackground: (background: Background) => void
  setZoom: (zoom: number) => void
  setStagePosition: (x: number, y: number) => void
  setCanvasDimensions: (width: number, height: number) => void
  addOverlay: (overlay: Overlay) => void
  updateOverlay: (id: string, updates: Partial<Overlay>) => void
  removeOverlay: (id: string) => void
  setDeviceShadow: (enabled: boolean) => void
  setScreenshotCornerRadius: (radius: number | null) => void
  markSaved: () => void
  getCanvasConfig: () => CanvasConfig
}

export const useCanvasStore = create<CanvasState>((set) => ({
  screenshot: null,
  screenshotWidth: 0,
  screenshotHeight: 0,
  screenshotMime: 'image/png',
  screenshotOffsetX: 0,
  screenshotOffsetY: 0,

  selectedDeviceId: 'iphone-17-pro-max',
  deviceVariant: 'light',

  background: backgroundPresets[0],

  overlays: [],

  deviceShadow: true,
  screenshotCornerRadius: null,

  canvasWidth: 1920,
  canvasHeight: 1080,
  zoom: 1,
  stageX: 0,
  stageY: 0,

  hasUnsavedChanges: false,

  setScreenshot: (base64, width = 0, height = 0, mime = 'image/png') =>
    set({ screenshot: base64, screenshotWidth: width, screenshotHeight: height, screenshotMime: mime, screenshotOffsetX: 0, screenshotOffsetY: 0, hasUnsavedChanges: true }),

  clearScreenshot: () => set({ screenshot: null, screenshotWidth: 0, screenshotHeight: 0, screenshotMime: 'image/png', screenshotOffsetX: 0, screenshotOffsetY: 0, hasUnsavedChanges: true }),

  setScreenshotOffset: (x, y) => set({ screenshotOffsetX: x, screenshotOffsetY: y, hasUnsavedChanges: true }),

  setDevice: (deviceId) => set({ selectedDeviceId: deviceId, hasUnsavedChanges: true }),

  setDeviceVariant: (variant) => set({ deviceVariant: variant, hasUnsavedChanges: true }),

  setBackground: (background) => set({ background, hasUnsavedChanges: true }),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  setStagePosition: (x, y) => set({ stageX: x, stageY: y }),

  setCanvasDimensions: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

  addOverlay: (overlay) => set((state) => ({ overlays: [...state.overlays, overlay], hasUnsavedChanges: true })),

  updateOverlay: (id, updates) =>
    set((state) => ({
      overlays: state.overlays.map((o) => (o.id === id ? { ...o, ...updates } : o)),
      hasUnsavedChanges: true
    })),

  removeOverlay: (id) =>
    set((state) => ({ overlays: state.overlays.filter((o) => o.id !== id), hasUnsavedChanges: true })),

  setDeviceShadow: (enabled) => set({ deviceShadow: enabled, hasUnsavedChanges: true }),

  setScreenshotCornerRadius: (radius) => set({ screenshotCornerRadius: radius, hasUnsavedChanges: true }),

  markSaved: () => set({ hasUnsavedChanges: false }),

  getCanvasConfig: () => {
    const state = useCanvasStore.getState()
    return {
      deviceId: state.selectedDeviceId,
      deviceVariant: state.deviceVariant,
      background: state.background,
      overlays: state.overlays,
      zoom: state.zoom,
      deviceShadow: state.deviceShadow,
      screenshotCornerRadius: state.screenshotCornerRadius
    }
  }
}))
