/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Canvas export functions attached to window by CanvasStage.tsx
type CanvasExportFn = (
  widthOrRatio?: number,
  targetHeight?: number,
  deviceId?: string
) => string | null | Promise<string | null>

interface Window {
  __canvasExport?: CanvasExportFn
  __canvasExportMime?: string
  __canvasStage?: unknown
}
