// IPC response wrapper
export interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Device frame definitions
export interface DeviceFrame {
  id: string
  name: string
  category: 'phone' | 'tablet' | 'laptop' | 'display' | 'browser'
  width: number
  height: number
  screenBounds: {
    x: number
    y: number
    width: number
    height: number
  }
  cornerRadius: number
  variants: ('light' | 'dark')[]
  assetPath: {
    light: string
    dark: string
  }
  hasDynamicIsland?: boolean
  dynamicIslandBounds?: { x: number; y: number; width: number; height: number; cornerRadius: number }
  noCutoutOf?: string  // ID of the standard device this is a no-cutout variant of
}

// Background configuration
export interface Background {
  type: 'gradient' | 'solid' | 'mesh' | 'image' | 'transparent'
  value: string // CSS gradient string, hex colour, or image path
  name: string
  colors?: string[] // gradient stop colours for Konva
}

// Overlay elements on canvas
export interface Overlay {
  id: string
  type: 'text' | 'badge'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  // Text overlay props
  text?: string
  fontSize?: number
  fontWeight?: number
  fontFamily?: string
  fill?: string
  align?: 'left' | 'center' | 'right'
  // Badge overlay props
  badgeType?: 'app-store' | 'play-store' | 'mac-app-store' | 'product-hunt'
  imageSrc?: string
}

// Notion capture options
export interface NotionCaptureOptions {
  pageId: string
  pageUrl: string
  viewport: 'mobile' | 'tablet' | 'desktop' | 'custom'
  viewportWidth?: number
  viewportHeight?: number
  captureMode: 'fullpage' | 'viewport'
  colorScheme: 'light' | 'dark'
  hideNavigation?: boolean
}

// Notion batch capture result
export interface NotionBatchResult {
  pageId: string
  base64?: string
  error?: string
}

// URL capture options
export interface CaptureURLOptions {
  url: string
  viewportWidth: number
  viewportHeight: number
  captureMode: 'fullpage' | 'viewport' | 'selector'
  selector?: string
  removeCookieBanners?: boolean
  preCaptureScript?: string
  waitForSelector?: string
  delayAfterLoad?: number
}

// Export options
export interface ExportOptions {
  base64: string
  filename: string
  format?: 'png' | 'webp'
}

// Batch export job
export interface ExportJob {
  base64: string
  filename: string
  format: 'png' | 'webp'
}

// Sitemap capture job
export interface SitemapCaptureJob {
  url: string
  captureMode: 'fullpage' | 'viewport' | 'selector'
  selector?: string
  viewportWidth?: number
  viewportHeight?: number
}

// Project
export interface Project {
  id: string
  name: string
  source_type: 'url' | 'upload' | 'simulator' | 'notion' | 'sheets' | 'local'
  source_data: Record<string, unknown>
  canvas_config: CanvasConfig
  thumbnail: string | null
  created_at: string | number
  updated_at: string | number
}

// App settings
export interface AppSettings {
  dataDirectory: string
}

// Canvas configuration stored in projects
export interface CanvasConfig {
  deviceId: string
  deviceVariant: 'light' | 'dark'
  background: Background
  overlays: Overlay[]
  zoom: number
  deviceShadow?: boolean
  screenshotCornerRadius?: number | null
}

// Capture library
export interface CaptureInput {
  base64: string
  mime?: string
  width: number
  height: number
  sourceType: string
  sourceLabel: string
}

export interface CaptureEntry {
  id: string
  mime: string
  width: number
  height: number
  source_type: string
  source_label: string
  captured_at: number
}

export interface CaptureRecord extends CaptureEntry {
  base64: string
}

// Window API exposed via preload
export interface FrameupAPI {
  capture: {
    url: (options: CaptureURLOptions) => Promise<IPCResponse<string>>
    file: (filePath: string) => Promise<IPCResponse<string>>
    simulator: {
      list: () => Promise<IPCResponse<SimulatorDevice[]>>
      capture: (deviceUDID: string) => Promise<IPCResponse<string>>
    }
  }
  sitemap: {
    fetch: (domain: string) => Promise<IPCResponse<string[]>>
    captureQueue: (urls: SitemapCaptureJob[]) => Promise<IPCResponse<string[]>>
    onProgress: (callback: (event: unknown, progress: { current: number; total: number }) => void) => void
    removeProgress: (callback: (...args: unknown[]) => void) => void
  }
  export: {
    png: (options: ExportOptions) => Promise<IPCResponse>
    batch: (jobs: ExportJob[]) => Promise<IPCResponse>
  }
  projects: {
    list: () => Promise<IPCResponse<Project[]>>
    get: (id: string) => Promise<IPCResponse<Project>>
    save: (project: unknown) => Promise<IPCResponse<Project>>
    update: (id: string, updates: unknown) => Promise<IPCResponse<Project>>
    remove: (id: string) => Promise<IPCResponse>
  }
  appSettings: {
    get: () => Promise<IPCResponse<AppSettings>>
    set: (updates: Partial<AppSettings>) => Promise<IPCResponse<AppSettings>>
    pickDirectory: () => Promise<IPCResponse<{ path: string | null }>>
  }
  notion: {
    auth: () => Promise<IPCResponse>
    exchangeCode: (code: string) => Promise<IPCResponse>
    listPages: () => Promise<IPCResponse<Array<{ id: string; title: string; url: string }>>>
    capture: (options: NotionCaptureOptions) => Promise<IPCResponse<string>>
    captureBatch: (jobs: NotionCaptureOptions[]) => Promise<IPCResponse<NotionBatchResult[]>>
    isConnected: () => Promise<IPCResponse<boolean>>
    disconnect: () => Promise<IPCResponse>
    onCallback: (callback: (event: unknown, status: string) => void) => void
    removeCallback: (callback: (event: unknown, status: string) => void) => void
    onBatchProgress: (callback: (event: unknown, progress: { current: number; total: number; pageId: string }) => void) => void
    removeBatchProgress: (callback: (...args: unknown[]) => void) => void
  }
  sheets: {
    auth: () => Promise<IPCResponse>
    exchangeCode: (code: string) => Promise<IPCResponse>
    list: () => Promise<IPCResponse<Array<{ id: string; name: string; modifiedTime: string; url: string }>>>
    capture: (sheetId: string) => Promise<IPCResponse<string>>
    isConnected: () => Promise<IPCResponse<boolean>>
    disconnect: () => Promise<IPCResponse>
    onCallback: (callback: (event: unknown, code: string) => void) => void
    removeCallback: (callback: (event: unknown, code: string) => void) => void
  }
  excel: {
    capture: (input: { html: string; width?: number }) => Promise<IPCResponse<string>>
  }
  shell: {
    openExternal: (url: string) => Promise<void>
  }
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
  }
  library: {
    add: (capture: CaptureInput) => Promise<IPCResponse<string>>
    addBatch: (captures: CaptureInput[]) => Promise<IPCResponse<string[]>>
    list: () => Promise<IPCResponse<CaptureEntry[]>>
    get: (id: string) => Promise<IPCResponse<CaptureRecord>>
    getThumbnail: (id: string) => Promise<IPCResponse<{ id: string; base64: string; mime: string }>>
    remove: (id: string) => Promise<IPCResponse>
    clear: () => Promise<IPCResponse>
  }
  updater: {
    checkForUpdates: () => Promise<IPCResponse>
    install: () => Promise<void>
    onStatus: (callback: (event: unknown, payload: { status: string; info?: unknown; progress?: unknown; error?: string }) => void) => void
    removeStatus: (callback: (...args: unknown[]) => void) => void
  }
  platform: string
}

export interface SimulatorDevice {
  udid: string
  name: string
  state: string
  deviceTypeIdentifier: string
  runtime: string
}

// Extend Window
declare global {
  interface Window {
    frameup: FrameupAPI
  }
}
