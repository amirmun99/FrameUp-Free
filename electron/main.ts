import { app, BrowserWindow, ipcMain, shell, session } from 'electron'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'

// Load .env file into process.env for the main process
// (electron-vite only auto-injects VITE_ vars into the renderer via import.meta.env)
function loadEnvFile() {
  const envPaths = [
    join(process.cwd(), '.env.local'),
    join(process.cwd(), '.env')
  ]
  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIndex = trimmed.indexOf('=')
        if (eqIndex === -1) continue
        const key = trimmed.slice(0, eqIndex).trim()
        const value = trimmed.slice(eqIndex + 1).trim()
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
  }
}
loadEnvFile()
import { registerCaptureHandlers } from './ipc/capture'
import { registerExportHandlers } from './ipc/export'
import { registerSimulatorHandlers } from './ipc/simulator'
import { registerSitemapHandlers } from './ipc/sitemap'
import { registerNotionHandlers, handleNotionCallback } from './ipc/notion'
import { registerSheetsHandlers, handleSheetsCallback } from './ipc/sheets'
import { registerUpdaterHandlers } from './ipc/updater'
import { registerLibraryHandlers } from './ipc/library'
import { registerExcelHandlers } from './ipc/excel'
import { registerProjectHandlers, initProjectsDb } from './ipc/projects'
import { registerSettingsHandlers, getAppSettings } from './ipc/appSettings'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#FFFFFF',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  // Production security: disable DevTools and enforce CSP
  if (!process.env.ELECTRON_RENDERER_URL) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow!.webContents.closeDevTools()
    })
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self';"
          ]
        }
      })
    })
  }

  // Intercept new window requests (window.open) — open in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Intercept in-page navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const rendererUrl = process.env.ELECTRON_RENDERER_URL
    const isInternal =
      url.startsWith('file://') ||
      (rendererUrl && url.startsWith(rendererUrl))

    if (!isInternal) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  // Load the renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Register deep link protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('frameup', process.execPath, [process.argv[1]])
  }
} else {
  app.setAsDefaultProtocolClient('frameup')
}

// Route a deep-link URL to the appropriate IPC channel
function handleDeepLink(url: string): void {
  if (!mainWindow) {
    global.__pendingDeepLink = url
    return
  }
  if (url.startsWith('frameup://notion/callback')) {
    const code = handleNotionCallback(url)
    if (code) mainWindow.webContents.send('notion:callback', code)
  } else if (url.startsWith('frameup://sheets/callback')) {
    const code = handleSheetsCallback(url)
    if (code) mainWindow.webContents.send('sheets:callback', code)
  } else {
    console.warn('[deep-link] Ignoring unrecognised scheme URL:', url)
  }
  if (mainWindow?.isMinimized()) mainWindow.restore()
  mainWindow?.focus()
}

// Handle deep link on macOS
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

// Single instance lock (for Windows deep link handling)
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    const url = commandLine.find((arg) => arg.startsWith('frameup://'))
    if (url) handleDeepLink(url)
  })
}

// Window control IPC handlers
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)

// Open external links in browser — only allow http/https schemes
ipcMain.handle('shell:openExternal', async (_, url: string) => {
  if (typeof url !== 'string') return
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return
    await shell.openExternal(url)
  } catch {
    // Invalid URL — ignore silently
  }
})

// Declare pending deep link storage
declare global {
  // eslint-disable-next-line no-var
  var __pendingDeepLink: string | undefined
}

app.whenReady().then(() => {
  createWindow()

  // Register IPC handlers
  const settings = getAppSettings()
  try {
    initProjectsDb(settings.dataDirectory)
  } catch (err) {
    console.error('[main] Failed to initialize projects DB:', err)
    // Continue — handlers will register but projects IPC will fail gracefully
  }
  registerCaptureHandlers()
  registerExportHandlers()
  registerSimulatorHandlers()
  registerSitemapHandlers()
  registerNotionHandlers()
  registerSheetsHandlers()
  registerUpdaterHandlers()
  registerLibraryHandlers()
  registerExcelHandlers()
  registerProjectHandlers()
  registerSettingsHandlers()

  // Send any deep link that arrived before the window was ready
  if (global.__pendingDeepLink && mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      const url = global.__pendingDeepLink
      if (url) {
        handleDeepLink(url)
        global.__pendingDeepLink = undefined
      }
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
