import { ipcMain, BrowserWindow, app, safeStorage } from 'electron'
import { createRequire } from 'module'
import { join } from 'path'
import { existsSync, unlinkSync, readFileSync, writeFileSync } from 'fs'
import { randomBytes } from 'crypto'
import { tmpdir } from 'os'

function getPlaywright() {
  const require = createRequire(join(process.cwd(), 'package.json'))
  return require('playwright') as typeof import('playwright')
}

// Store Notion access token in memory (per session)
let notionAccessToken: string | null = null

// Redirect URI — registered in Notion integration settings.
// We intercept this URL in Playwright before it actually loads, so no HTTP server needed.
const NOTION_REDIRECT_URI = 'http://localhost:19382/notion/callback'

// Fix 11: Store Notion session cookies encrypted at rest using OS keychain (safeStorage).
// Encrypted blob file replaces the legacy plaintext JSON.
const STORAGE_STATE_PATH = join(app.getPath('userData'), 'notion-browser-state.enc')
const LEGACY_STORAGE_STATE_PATH = join(app.getPath('userData'), 'notion-browser-state.json')

/** Returns true if an encrypted (or legacy plaintext) session exists on disk. */
function hasStoredSession(): boolean {
  return existsSync(STORAGE_STATE_PATH) || existsSync(LEGACY_STORAGE_STATE_PATH)
}

/**
 * Serialize and encrypt a Playwright storage state to disk.
 * Falls back to restricted-permissions plaintext when safeStorage is unavailable.
 */
function saveSessionState(json: string): void {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(json)
    writeFileSync(STORAGE_STATE_PATH, encrypted)
  } else {
    // safeStorage unavailable (e.g. headless CI) — write with tight permissions
    writeFileSync(STORAGE_STATE_PATH, json, { mode: 0o600, encoding: 'utf-8' as BufferEncoding })
  }
}

/**
 * Decrypt the stored session to a temporary JSON file that Playwright can use.
 * The caller is responsible for deleting the temp file after use.
 * Returns null if no session is stored.
 */
function getDecryptedStatePath(): string | null {
  // Migrate legacy plaintext file to encrypted format on first access
  if (!existsSync(STORAGE_STATE_PATH) && existsSync(LEGACY_STORAGE_STATE_PATH)) {
    try {
      const json = readFileSync(LEGACY_STORAGE_STATE_PATH, 'utf-8')
      saveSessionState(json)
      unlinkSync(LEGACY_STORAGE_STATE_PATH)
    } catch {
      // Migration failed — fall back to legacy path for this session
      return LEGACY_STORAGE_STATE_PATH
    }
  }

  if (!existsSync(STORAGE_STATE_PATH)) return null

  try {
    const raw = readFileSync(STORAGE_STATE_PATH)
    const json = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(raw)
      : raw.toString('utf-8')

    // Write to a uniquely named temp file with restrictive permissions
    const tmpPath = join(tmpdir(), `notion-state-${randomBytes(8).toString('hex')}.json`)
    writeFileSync(tmpPath, json, { mode: 0o600, encoding: 'utf-8' as BufferEncoding })
    return tmpPath
  } catch {
    return null
  }
}

// Viewport presets with mobile emulation settings
const VIEWPORT_PRESETS: Record<string, {
  width: number
  height: number
  isMobile?: boolean
  userAgent?: string
}> = {
  mobile: {
    width: 390,
    height: 844,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  tablet: {
    width: 768,
    height: 1024,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  desktop: { width: 1440, height: 900 }
}

interface NotionCaptureOptions {
  pageId: string
  pageUrl: string
  viewport: 'mobile' | 'tablet' | 'desktop' | 'custom'
  viewportWidth?: number
  viewportHeight?: number
  captureMode: 'fullpage' | 'viewport'
  colorScheme: 'light' | 'dark'
  hideNavigation?: boolean
}

/**
 * Force-close a Playwright browser and kill the underlying Chromium process.
 * Playwright's browser.close() doesn't always terminate the process in Electron.
 */
async function forceCloseBrowser(browser: unknown): Promise<void> {
  if (!browser) return
  try {
    const b = browser as { close: () => Promise<void>; process: () => { pid: number } | null }
    const proc = b.process()
    await b.close()
    if (proc?.pid) {
      try { process.kill(proc.pid, 'SIGKILL') } catch { /* already dead */ }
    }
  } catch { /* ignore cleanup errors */ }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeNotionCode(code: string): Promise<{ success: boolean; error?: string }> {
  const clientId = process.env.NOTION_CLIENT_ID || process.env.VITE_NOTION_CLIENT_ID
  const clientSecret = process.env.NOTION_CLIENT_SECRET || process.env.VITE_NOTION_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return { success: false, error: 'Notion credentials not configured' }
  }

  const response = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: NOTION_REDIRECT_URI
    })
  })

  if (!response.ok) {
    const body = await response.text()
    return { success: false, error: `OAuth failed: ${body}` }
  }

  const data = await response.json()
  notionAccessToken = data.access_token
  return { success: true }
}

/**
 * Capture a single Notion page using an authenticated Playwright browser session.
 */
async function captureNotionPage(
  chromium: Awaited<ReturnType<typeof getPlaywright>>['chromium'],
  options: NotionCaptureOptions
): Promise<{ base64?: string; error?: string }> {
  const vp = options.viewport === 'custom'
    ? { width: options.viewportWidth || 1440, height: options.viewportHeight || 900 }
    : VIEWPORT_PRESETS[options.viewport] || VIEWPORT_PRESETS.desktop

  let browser
  let tmpStatePath: string | null = null
  try {
    console.log('[notion] Capturing page:', options.pageUrl, 'viewport:', options.viewport, 'colorScheme:', options.colorScheme)
    browser = await chromium.launch({ headless: true })

    // Fix 11: Use decrypted temp file instead of plaintext session JSON
    tmpStatePath = getDecryptedStatePath()
    if (!tmpStatePath) throw new Error('not_connected')

    const contextOptions: Record<string, unknown> = {
      storageState: tmpStatePath,
      colorScheme: options.colorScheme,
      viewport: { width: vp.width, height: vp.height }
    }
    // Mobile/tablet emulation — set user agent and isMobile so Notion serves its mobile layout
    if (vp.isMobile) {
      contextOptions.isMobile = true
      contextOptions.hasTouch = true
      contextOptions.deviceScaleFactor = 2
    }
    if (vp.userAgent) {
      contextOptions.userAgent = vp.userAgent
    }
    const context = await browser.newContext(contextOptions)
    const page = await context.newPage()

    // Use domcontentloaded — Notion's SPA never reaches networkidle
    await page.goto(options.pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    console.log('[notion] Page navigated, current URL:', page.url())

    // Wait for Notion page content to render
    try {
      await page.waitForSelector(
        '.notion-page-content, .notion-collection_view-block, .notion-table-view, .notion-board-view, .notion-calendar-view, .notion-gallery-view, .notion-scroller',
        { timeout: 15000 }
      )
      console.log('[notion] Content selector found')
    } catch {
      console.log('[notion] Content selector not found, continuing with what loaded')
    }

    // Wait for content to finish rendering (databases, images, etc.)
    await page.waitForTimeout(3000)

    // Scroll to bottom and back to trigger lazy-loaded content
    await page.evaluate(async () => {
      const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
      window.scrollTo(0, document.body.scrollHeight)
      await delay(1000)
      window.scrollTo(0, 0)
      await delay(500)
    })

    // Optionally hide Notion navigation chrome for cleaner captures
    if (options.hideNavigation !== false) {
      await page.addStyleTag({ content: `
        .notion-sidebar-container { display: none !important; }
        .notion-topbar { display: none !important; }
        .notion-frame { margin-left: 0 !important; width: 100% !important; }
        .notion-peek-renderer { display: none !important; }
        .notion-overlay-container { display: none !important; }
        .notion-help-button { display: none !important; }
        .notion-presence-container { display: none !important; }
      `})
      await page.waitForTimeout(300)
    }

    const screenshotBuffer = await page.screenshot({
      fullPage: options.captureMode === 'fullpage'
    })
    console.log('[notion] Screenshot captured, size:', screenshotBuffer.length, 'bytes')

    await context.close()
    return { base64: screenshotBuffer.toString('base64') }
  } catch (err) {
    console.error('[notion] Capture error:', (err as Error).message)
    return { error: (err as Error).message }
  } finally {
    await forceCloseBrowser(browser)
    // Fix 11: Delete the temporary decrypted session file
    if (tmpStatePath && tmpStatePath !== LEGACY_STORAGE_STATE_PATH) {
      try { unlinkSync(tmpStatePath) } catch { /* ignore */ }
    }
  }
}

export function registerNotionHandlers(): void {
  // Single auth flow: Playwright browser login + OAuth + save cookies
  ipcMain.handle('notion:auth', async () => {
    const clientId = process.env.NOTION_CLIENT_ID || process.env.VITE_NOTION_CLIENT_ID
    if (!clientId) {
      return { success: false, error: 'Notion client ID not configured. Set NOTION_CLIENT_ID in your .env file.' }
    }

    const { chromium } = getPlaywright()
    let browser
    try {
      browser = await chromium.launch({ headless: false })
      const context = await browser.newContext()
      const page = await context.newPage()

      // Step 1: Intercept the callback URL before the browser tries to load it.
      // There's no HTTP server on localhost:19382 — we catch the redirect in-flight.
      let callbackCode: string | null = null
      let callbackError: string | null = null
      const codeReceived = new Promise<void>((resolve) => {
        page.route('**/notion/callback**', async (route) => {
          const url = new URL(route.request().url())
          callbackCode = url.searchParams.get('code')
          callbackError = url.searchParams.get('error')
          console.log('[notion] Intercepted callback, code:', !!callbackCode, 'error:', callbackError)
          // Abort the request so the browser doesn't try to load localhost
          await route.abort()
          resolve()
        })
      })

      // Step 2: Navigate directly to the OAuth authorize URL.
      // If the user isn't logged in, Notion will redirect to login first,
      // then back to authorize after login.
      const redirectUri = encodeURIComponent(NOTION_REDIRECT_URI)
      const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUri}`

      console.log('[notion] Opening OAuth URL:', authUrl)
      await page.goto(authUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      console.log('[notion] Page loaded, current URL:', page.url())

      // Step 3: Wait for the callback redirect to be intercepted.
      // This handles login → authorize → redirect, or direct authorize → redirect.
      console.log('[notion] Waiting for callback redirect...')
      const timeout = setTimeout(() => {
        // Safety: resolve after 5 minutes even if no callback
      }, 300000)
      await Promise.race([
        codeReceived,
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Login timed out. Please try again.')), 300000)
        )
      ])
      clearTimeout(timeout)

      if (callbackError || !callbackCode) {
        return { success: false, error: callbackError ?? 'No authorization code received' }
      }

      // Step 4: Exchange code for API token
      const result = await exchangeNotionCode(callbackCode)
      if (!result.success) return result
      console.log('[notion] Token exchange successful')

      // Step 5: Save browser cookies for future headless captures.
      // After route.abort(), the page is in an error state. Navigate back to Notion
      // to get a clean page, then save the full authenticated session.
      try {
        await page.goto('https://www.notion.so', { waitUntil: 'domcontentloaded', timeout: 15000 })
        await page.waitForTimeout(1000)
      } catch {
        console.log('[notion] Navigation back to Notion failed, saving state from current context')
      }
      // Fix 11: Save session encrypted rather than as plaintext JSON
      const state = await context.storageState()
      saveSessionState(JSON.stringify(state))
      console.log('[notion] Browser state saved (encrypted) to', STORAGE_STATE_PATH)

      // Notify renderer
      const win = BrowserWindow.getAllWindows()[0]
      if (win) {
        win.webContents.send('notion:callback', 'success')
      }

      return { success: true }
    } catch (err) {
      const msg = (err as Error).message ?? ''
      console.error('[notion] Auth error:', msg)
      if (msg.includes('Timeout') || msg.includes('timeout')) {
        return { success: false, error: 'Login timed out. Please try again.' }
      }
      return { success: false, error: msg }
    } finally {
      await forceCloseBrowser(browser)
    }
  })

  // Keep exchangeCode for backward compatibility
  ipcMain.handle('notion:exchangeCode', async (_, code: string) => {
    try {
      return await exchangeNotionCode(code)
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // List Notion pages accessible to the integration
  ipcMain.handle('notion:listPages', async () => {
    try {
      if (!notionAccessToken) {
        return { success: false, error: 'Not connected to Notion' }
      }

      const response = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionAccessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: { property: 'object', value: 'page' },
          sort: { direction: 'descending', timestamp: 'last_edited_time' },
          page_size: 50
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          notionAccessToken = null
          return { success: false, error: 'Session expired. Please reconnect.' }
        }
        return { success: false, error: 'Failed to list pages' }
      }

      const data = await response.json()
      const pages = data.results.map((page: Record<string, unknown>) => {
        const props = page.properties as Record<string, { title?: Array<{ plain_text: string }> }>
        const titleProp = Object.values(props).find((p) => p.title)
        const title = titleProp?.title?.[0]?.plain_text ?? 'Untitled'
        return {
          id: page.id,
          title,
          url: page.url
        }
      })

      return { success: true, data: pages }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Capture a single Notion page — always headless
  ipcMain.handle('notion:capture', async (_, options: NotionCaptureOptions) => {
    try {
      if (!hasStoredSession()) {
        return { success: false, error: 'not_connected' }
      }

      const { chromium } = getPlaywright()
      const result = await captureNotionPage(chromium, options)

      if (result.error) {
        return { success: false, error: result.error }
      }

      return { success: true, data: result.base64 }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Batch capture multiple Notion pages — always headless, one browser for all
  ipcMain.handle('notion:captureBatch', async (_, jobs: NotionCaptureOptions[]) => {
    if (!hasStoredSession()) {
      return { success: false, error: 'not_connected' }
    }

    const { chromium } = getPlaywright()
    const results: Array<{ pageId: string; base64?: string; error?: string }> = []
    const win = BrowserWindow.getAllWindows()[0]

    // Capture each page with its own browser instance (clean state per page)
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]

      if (win) {
        win.webContents.send('notion:batchProgress', {
          current: i + 1,
          total: jobs.length,
          pageId: job.pageId
        })
      }

      const result = await captureNotionPage(chromium, job)
      results.push({
        pageId: job.pageId,
        base64: result.base64,
        error: result.error
      })
    }

    return { success: true, data: results }
  })

  // Check if connected (OAuth API token)
  ipcMain.handle('notion:isConnected', async () => {
    return { success: true, data: notionAccessToken !== null }
  })

  // Disconnect — clear stored token and both encrypted and legacy session files
  ipcMain.handle('notion:disconnect', async () => {
    notionAccessToken = null
    if (existsSync(STORAGE_STATE_PATH)) {
      try { unlinkSync(STORAGE_STATE_PATH) } catch { /* ignore */ }
    }
    if (existsSync(LEGACY_STORAGE_STATE_PATH)) {
      try { unlinkSync(LEGACY_STORAGE_STATE_PATH) } catch { /* ignore */ }
    }
    return { success: true }
  })
}

// Called from main.ts when a deep link arrives (kept for backward compatibility)
export function handleNotionCallback(url: string): string | null {
  const urlObj = new URL(url)
  return urlObj.searchParams.get('code')
}
