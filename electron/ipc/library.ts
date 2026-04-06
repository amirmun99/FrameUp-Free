import { ipcMain, app } from 'electron'
import { join } from 'path'
import { createRequire } from 'module'
import { randomUUID } from 'crypto'
import type BetterSqlite3 from 'better-sqlite3'

// Resolve better-sqlite3 from project root (same pattern as playwright in capture.ts)
function getBetterSqlite3() {
  const require = createRequire(join(process.cwd(), 'package.json'))
  return require('better-sqlite3') as typeof BetterSqlite3
}

let db: BetterSqlite3.Database | null = null

function getDb(): BetterSqlite3.Database {
  if (!db) {
    const Database = getBetterSqlite3()
    const dbPath = join(app.getPath('userData'), 'captures.db')
    console.log('[library] Opening database at:', dbPath)
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.exec(`
      CREATE TABLE IF NOT EXISTS captures (
        id TEXT PRIMARY KEY,
        base64 TEXT NOT NULL,
        mime TEXT NOT NULL DEFAULT 'image/png',
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        source_type TEXT NOT NULL,
        source_label TEXT NOT NULL DEFAULT '',
        captured_at INTEGER NOT NULL,
        user_id TEXT NOT NULL DEFAULT ''
      )
    `)
    // Migrate: add user_id column if missing (existing DBs)
    try {
      db.exec(`ALTER TABLE captures ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`)
    } catch {
      // Column already exists
    }
    console.log('[library] Database ready')
  }
  return db
}

interface CaptureInput {
  base64: string
  mime?: string
  width: number
  height: number
  sourceType: string
  sourceLabel: string
  userId?: string
}

export function registerLibraryHandlers(): void {
  ipcMain.handle('library:add', (_, capture: CaptureInput) => {
    try {
      const database = getDb()
      const id = randomUUID()
      const now = Date.now()
      database.prepare(
        'INSERT INTO captures (id, base64, mime, width, height, source_type, source_label, captured_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(id, capture.base64, capture.mime ?? 'image/png', capture.width, capture.height, capture.sourceType, capture.sourceLabel, now, capture.userId || '')
      return { success: true, data: id }
    } catch (err) {
      console.error('[library:add] Error:', err)
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('library:addBatch', (_, captures: CaptureInput[]) => {
    try {
      const database = getDb()
      const stmt = database.prepare(
        'INSERT INTO captures (id, base64, mime, width, height, source_type, source_label, captured_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      const ids: string[] = []
      const now = Date.now()
      const insertMany = database.transaction((items: CaptureInput[]) => {
        for (const capture of items) {
          const id = randomUUID()
          stmt.run(id, capture.base64, capture.mime ?? 'image/png', capture.width, capture.height, capture.sourceType, capture.sourceLabel, now, capture.userId || '')
          ids.push(id)
        }
      })
      insertMany(captures)
      return { success: true, data: ids }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('library:list', (_) => {
    try {
      const database = getDb()
      const rows = database.prepare(
        'SELECT id, mime, width, height, source_type, source_label, captured_at FROM captures ORDER BY captured_at DESC'
      ).all()
      return { success: true, data: rows }
    } catch (err) {
      console.error('[library:list] Error:', err)
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('library:get', (_, id: string) => {
    try {
      const database = getDb()
      const row = database.prepare('SELECT * FROM captures WHERE id = ?').get(id)
      if (!row) return { success: false, error: 'Capture not found' }
      return { success: true, data: row }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('library:getThumbnail', (_, id: string) => {
    try {
      const database = getDb()
      const row = database.prepare('SELECT id, base64, mime FROM captures WHERE id = ?').get(id)
      if (!row) return { success: false, error: 'Capture not found' }
      return { success: true, data: row }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('library:remove', (_, id: string) => {
    try {
      const database = getDb()
      database.prepare('DELETE FROM captures WHERE id = ?').run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('library:clear', (_) => {
    try {
      const database = getDb()
      database.prepare('DELETE FROM captures').run()
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })
}
