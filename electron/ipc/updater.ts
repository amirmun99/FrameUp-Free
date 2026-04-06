import { ipcMain, BrowserWindow, app } from 'electron'

type AutoUpdater = {
  checkForUpdatesAndNotify: () => Promise<unknown>
  quitAndInstall: (isSilent?: boolean, isForceRunAfter?: boolean) => void
  on: (event: string, callback: (...args: unknown[]) => void) => void
}

let autoUpdater: AutoUpdater | null = null

function getWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
}

export function registerUpdaterHandlers(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { autoUpdater: updater } = require('electron-updater')
    autoUpdater = updater as AutoUpdater

    // Don't auto-download — let the user decide when to install
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(autoUpdater as any).autoDownload = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(autoUpdater as any).autoInstallOnAppQuit = true

    autoUpdater.on('update-available', (info: unknown) => {
      const win = getWindow()
      if (win) win.webContents.send('updater:status', { status: 'available', info })
    })

    autoUpdater.on('download-progress', (progress: unknown) => {
      const win = getWindow()
      if (win) win.webContents.send('updater:status', { status: 'downloading', progress })
    })

    autoUpdater.on('update-downloaded', (info: unknown) => {
      const win = getWindow()
      if (win) win.webContents.send('updater:status', { status: 'downloaded', info })
    })

    autoUpdater.on('update-not-available', () => {
      const win = getWindow()
      if (win) win.webContents.send('updater:status', { status: 'up-to-date' })
    })

    autoUpdater.on('error', (err: Error) => {
      const win = getWindow()
      if (win) win.webContents.send('updater:status', { status: 'error', error: err.message })
    })

    // Check for updates ~10s after launch (give the window time to render)
    if (!process.env.ELECTRON_RENDERER_URL) {
      setTimeout(() => {
        autoUpdater?.checkForUpdatesAndNotify().catch(() => {})
      }, 10_000)
    }
  } catch {
    // electron-updater not available (dev environment or missing dep)
  }

  // Manual check triggered from the renderer (Settings page)
  ipcMain.handle('updater:check', async () => {
    try {
      if (!autoUpdater) return { success: false, error: 'Auto-updater not available' }
      await autoUpdater.checkForUpdatesAndNotify()
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Quit and install — called from renderer after user confirms the update prompt
  ipcMain.handle('updater:install', () => {
    if (autoUpdater) {
      // Relaunch the app after installing
      autoUpdater.quitAndInstall(false, true)
    } else {
      app.relaunch()
      app.quit()
    }
  })
}
