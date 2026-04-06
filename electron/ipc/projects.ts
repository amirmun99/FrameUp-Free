import { ipcMain } from 'electron'
import { join } from 'path'
import { createRequire } from 'module'
import { randomUUID } from 'crypto'
import type BetterSqlite3 from 'better-sqlite3'

// SQLite-backed project CRUD for local storage
// DB file: {dataDirectory}/projects.db
// The dataDirectory is passed in via initProjectsDb()

function getBetterSqlite3() {
  const require = createRequire(join(process.cwd(), 'package.json'))
  return require('better-sqlite3') as typeof BetterSqlite3
}

let db: BetterSqlite3.Database | null = null

export function initProjectsDb(dataDirectory: string): void {
  const Database = getBetterSqlite3()
  const dbPath = join(dataDirectory, 'projects.db')
  console.log('[projects] Opening database at:', dbPath)
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT '',
      source_data TEXT NOT NULL DEFAULT '{}',
      canvas_config TEXT NOT NULL DEFAULT '{}',
      thumbnail TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  console.log('[projects] Database ready')
}

function getDb(): BetterSqlite3.Database {
  if (!db) throw new Error('Projects database not initialised — call initProjectsDb() first')
  return db
}

interface ProjectRow {
  id: string
  name: string
  source_type: string
  source_data: string
  canvas_config: string
  thumbnail: string | null
  created_at: number
  updated_at: number
}

function parseRow(row: ProjectRow) {
  let source_data: Record<string, unknown> = {}
  let canvas_config: Record<string, unknown> = {}
  try { source_data = JSON.parse(row.source_data) } catch { /* use default */ }
  try { canvas_config = JSON.parse(row.canvas_config) } catch { /* use default */ }
  return { ...row, source_data, canvas_config }
}

interface ProjectSaveInput {
  name: string
  source_type?: string
  source_data?: object
  canvas_config?: object
  thumbnail?: string
}

interface ProjectUpdateInput {
  id: string
  updates: {
    name?: string
    canvas_config?: object
    thumbnail?: string
    source_data?: object
  }
}

export function registerProjectHandlers(): void {
  ipcMain.handle('projects:list', (_) => {
    try {
      const database = getDb()
      const rows = database.prepare(
        'SELECT * FROM projects ORDER BY updated_at DESC'
      ).all() as ProjectRow[]
      return { success: true, data: rows.map(parseRow) }
    } catch (err) {
      console.error('[projects:list] Error:', err)
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('projects:get', (_, id: string) => {
    try {
      const database = getDb()
      const row = database.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined
      if (!row) return { success: false, error: 'Project not found' }
      return { success: true, data: parseRow(row) }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('projects:save', (_, project: ProjectSaveInput) => {
    try {
      const database = getDb()
      const id = randomUUID()
      const now = Date.now()
      database.prepare(
        'INSERT INTO projects (id, name, source_type, source_data, canvas_config, thumbnail, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        id,
        project.name,
        project.source_type ?? '',
        JSON.stringify(project.source_data ?? {}),
        JSON.stringify(project.canvas_config ?? {}),
        project.thumbnail ?? null,
        now,
        now
      )
      const row = database.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow
      return { success: true, data: parseRow(row) }
    } catch (err) {
      console.error('[projects:save] Error:', err)
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('projects:update', (_, id: string, updates: ProjectUpdateInput['updates']) => {
    try {
      const database = getDb()
      const existing = database.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined
      if (!existing) return { success: false, error: 'Project not found' }

      const now = Date.now()
      const fields: string[] = ['updated_at = ?']
      const values: unknown[] = [now]

      if (updates.name !== undefined) {
        fields.push('name = ?')
        values.push(updates.name)
      }
      if (updates.canvas_config !== undefined) {
        fields.push('canvas_config = ?')
        values.push(JSON.stringify(updates.canvas_config))
      }
      if (updates.thumbnail !== undefined) {
        fields.push('thumbnail = ?')
        values.push(updates.thumbnail)
      }
      if (updates.source_data !== undefined) {
        fields.push('source_data = ?')
        values.push(JSON.stringify(updates.source_data))
      }

      values.push(id)
      database.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values)

      const row = database.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow
      return { success: true, data: parseRow(row) }
    } catch (err) {
      console.error('[projects:update] Error:', err)
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('projects:remove', (_, id: string) => {
    try {
      const database = getDb()
      database.prepare('DELETE FROM projects WHERE id = ?').run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })
}
