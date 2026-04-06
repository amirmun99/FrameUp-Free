import { contextBridge, ipcRenderer } from 'electron'

console.log('[preload] Loading frameup API bridge, platform:', process.platform)

const api = {
  capture: {
    url: (options: unknown) => ipcRenderer.invoke('capture:url', options),
    file: (filePath: string) => ipcRenderer.invoke('capture:file', filePath),
    simulator: {
      list: () => ipcRenderer.invoke('capture:simulator:list'),
      capture: (deviceUDID: string) => ipcRenderer.invoke('capture:simulator:capture', deviceUDID)
    }
  },
  sitemap: {
    fetch: (domain: string) => ipcRenderer.invoke('sitemap:fetch', domain),
    captureQueue: (urls: unknown[]) => ipcRenderer.invoke('sitemap:captureQueue', urls),
    onProgress: (callback: (...args: unknown[]) => void) => ipcRenderer.on('sitemap:progress', callback),
    removeProgress: (callback: (...args: unknown[]) => void) => ipcRenderer.removeListener('sitemap:progress', callback)
  },
  export: {
    png: (options: unknown) => ipcRenderer.invoke('export:png', options),
    batch: (jobs: unknown[]) => ipcRenderer.invoke('export:batch', jobs)
  },
  notion: {
    auth: () => ipcRenderer.invoke('notion:auth'),
    exchangeCode: (code: string) => ipcRenderer.invoke('notion:exchangeCode', code),
    listPages: () => ipcRenderer.invoke('notion:listPages'),
    capture: (options: unknown) => ipcRenderer.invoke('notion:capture', options),
    captureBatch: (jobs: unknown[]) => ipcRenderer.invoke('notion:captureBatch', jobs),
    isConnected: () => ipcRenderer.invoke('notion:isConnected'),
    disconnect: () => ipcRenderer.invoke('notion:disconnect'),
    onCallback: (callback: (...args: unknown[]) => void) => ipcRenderer.on('notion:callback', callback),
    removeCallback: (callback: (...args: unknown[]) => void) => ipcRenderer.removeListener('notion:callback', callback),
    onBatchProgress: (callback: (...args: unknown[]) => void) => ipcRenderer.on('notion:batchProgress', callback),
    removeBatchProgress: (callback: (...args: unknown[]) => void) => ipcRenderer.removeListener('notion:batchProgress', callback)
  },
  sheets: {
    auth: () => ipcRenderer.invoke('sheets:auth'),
    exchangeCode: (code: string) => ipcRenderer.invoke('sheets:exchangeCode', code),
    list: () => ipcRenderer.invoke('sheets:list'),
    capture: (sheetId: string) => ipcRenderer.invoke('sheets:capture', sheetId),
    isConnected: () => ipcRenderer.invoke('sheets:isConnected'),
    disconnect: () => ipcRenderer.invoke('sheets:disconnect'),
    onCallback: (callback: (...args: unknown[]) => void) => ipcRenderer.on('sheets:callback', callback),
    removeCallback: (callback: (...args: unknown[]) => void) => ipcRenderer.removeListener('sheets:callback', callback)
  },
  excel: {
    capture: (input: unknown) => ipcRenderer.invoke('excel:capture', input)
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url)
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized')
  },
  library: {
    add: (capture: unknown) => ipcRenderer.invoke('library:add', capture),
    addBatch: (captures: unknown[]) => ipcRenderer.invoke('library:addBatch', captures),
    list: () => ipcRenderer.invoke('library:list'),
    get: (id: string) => ipcRenderer.invoke('library:get', id),
    getThumbnail: (id: string) => ipcRenderer.invoke('library:getThumbnail', id),
    remove: (id: string) => ipcRenderer.invoke('library:remove', id),
    clear: () => ipcRenderer.invoke('library:clear')
  },
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    get: (id: string) => ipcRenderer.invoke('projects:get', id),
    save: (project: unknown) => ipcRenderer.invoke('projects:save', project),
    update: (id: string, updates: unknown) => ipcRenderer.invoke('projects:update', id, updates),
    remove: (id: string) => ipcRenderer.invoke('projects:remove', id)
  },
  appSettings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (updates: unknown) => ipcRenderer.invoke('settings:set', updates),
    pickDirectory: () => ipcRenderer.invoke('settings:pickDirectory')
  },
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),
    install: () => ipcRenderer.invoke('updater:install'),
    onStatus: (callback: (...args: unknown[]) => void) => ipcRenderer.on('updater:status', callback),
    removeStatus: (callback: (...args: unknown[]) => void) => ipcRenderer.removeListener('updater:status', callback)
  },
  platform: process.platform
}

contextBridge.exposeInMainWorld('frameup', api)
console.log('[preload] frameup API bridge exposed successfully')
