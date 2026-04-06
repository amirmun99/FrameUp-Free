import { ipcMain, app, dialog } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

// Reads and writes {userData}/settings.json
// Stores: { dataDirectory: string }
// Default dataDirectory: app.getPath('userData')

interface AppSettingsData {
  dataDirectory: string
}

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export function getAppSettings(): AppSettingsData {
  const defaults: AppSettingsData = {
    dataDirectory: app.getPath('userData')
  }
  const settingsPath = getSettingsPath()
  if (!existsSync(settingsPath)) {
    return defaults
  }
  try {
    const raw = readFileSync(settingsPath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppSettingsData>
    return {
      dataDirectory: parsed.dataDirectory ?? defaults.dataDirectory
    }
  } catch (err) {
    console.error('[appSettings] Failed to read settings.json, using defaults:', err)
    return defaults
  }
}

function writeAppSettings(settings: AppSettingsData): void {
  const settingsPath = getSettingsPath()
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', (_) => {
    try {
      const settings = getAppSettings()
      return { success: true, data: settings }
    } catch (err) {
      console.error('[settings:get] Error:', err)
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('settings:set', (_, updates: Partial<AppSettingsData>) => {
    try {
      const current = getAppSettings()
      const updated: AppSettingsData = {
        ...current,
        ...(updates.dataDirectory !== undefined ? { dataDirectory: updates.dataDirectory } : {})
      }
      writeAppSettings(updated)
      return { success: true, data: updated }
    } catch (err) {
      console.error('[settings:set] Error:', err)
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('settings:pickDirectory', async (_) => {
    try {
      const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
      const path = result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
      return { success: true, data: { path } }
    } catch (err) {
      console.error('[settings:pickDirectory] Error:', err)
      return { success: false, error: (err as Error).message }
    }
  })
}
