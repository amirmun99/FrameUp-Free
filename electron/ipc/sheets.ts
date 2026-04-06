import { ipcMain, shell, BrowserWindow } from 'electron'
import { createRequire } from 'module'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { join } from 'path'
import { randomBytes } from 'crypto'

function getPlaywright() {
  const require = createRequire(join(process.cwd(), 'package.json'))
  return require('playwright') as typeof import('playwright')
}

// Store Google OAuth tokens in memory (per session)
let googleAccessToken: string | null = null

// Fixed port for local OAuth callback server
const SHEETS_CALLBACK_PORT = 19383
const SHEETS_REDIRECT_URI = `http://localhost:${SHEETS_CALLBACK_PORT}/sheets/callback`

/**
 * Exchange authorization code for access token
 */
async function exchangeSheetsCode(code: string): Promise<{ success: boolean; error?: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return { success: false, error: 'Google credentials not configured' }
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: SHEETS_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  })

  if (!response.ok) {
    const body = await response.text()
    return { success: false, error: `OAuth failed: ${body}` }
  }

  const data = await response.json()
  googleAccessToken = data.access_token
  return { success: true }
}

export function registerSheetsHandlers(): void {
  // Start Google OAuth flow using a local HTTP server for the callback
  ipcMain.handle('sheets:auth', async () => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        return { success: false, error: 'Google client ID not configured' }
      }

      // Generate CSRF nonce for OAuth state parameter
      const oauthState = randomBytes(16).toString('hex')

      return new Promise((resolve) => {
        const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
          const url = new URL(req.url ?? '', `http://localhost:${SHEETS_CALLBACK_PORT}`)

          if (url.pathname === '/sheets/callback') {
            // Verify OAuth state to prevent CSRF
            const returnedState = url.searchParams.get('state')
            if (returnedState !== oauthState) {
              res.writeHead(403, { 'Content-Type': 'text/html' })
              res.end('<html><body><h2>Invalid request</h2><p>OAuth state mismatch. Please try again.</p></body></html>')
              server.close()
              return
            }

            const code = url.searchParams.get('code')
            const error = url.searchParams.get('error')

            if (error || !code) {
              res.writeHead(200, { 'Content-Type': 'text/html' })
              res.end('<html><body><h2>Authorization failed</h2><p>You can close this tab.</p></body></html>')
              server.close()
              const win = BrowserWindow.getAllWindows()[0]
              if (win) win.webContents.send('sheets:callback', 'error')
              return
            }

            const result = await exchangeSheetsCode(code)

            if (result.success) {
              res.writeHead(200, { 'Content-Type': 'text/html' })
              res.end('<html><body><h2>Connected to Google Sheets!</h2><p>You can close this tab and return to Frameup.</p></body></html>')
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' })
              res.end(`<html><body><h2>Connection failed</h2><p>${result.error}</p><p>You can close this tab.</p></body></html>`)
            }

            server.close()

            const win = BrowserWindow.getAllWindows()[0]
            if (win) {
              win.webContents.send('sheets:callback', result.success ? 'success' : 'error')
            }
          }
        })

        server.on('error', (err) => {
          console.error('[sheets] Failed to start callback server:', err.message)
          resolve({ success: false, error: `Failed to start OAuth callback server: ${err.message}` })
        })

        server.listen(SHEETS_CALLBACK_PORT, () => {
          const redirectUri = encodeURIComponent(SHEETS_REDIRECT_URI)
          const scope = encodeURIComponent('https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly')
          const state = encodeURIComponent(oauthState)
          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&state=${state}`

          shell.openExternal(authUrl)
          resolve({ success: true })
        })

        // Auto-close server after 5 minutes if no callback received
        setTimeout(() => {
          server.close()
        }, 5 * 60 * 1000)
      })
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Keep exchangeCode for backward compatibility
  ipcMain.handle('sheets:exchangeCode', async (_, code: string) => {
    try {
      return await exchangeSheetsCode(code)
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // List user's spreadsheets via Google Drive API
  ipcMain.handle('sheets:list', async () => {
    try {
      if (!googleAccessToken) {
        return { success: false, error: 'Not connected to Google Sheets' }
      }

      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.spreadsheet%27&orderBy=modifiedTime%20desc&pageSize=50&fields=files(id%2Cname%2CmodifiedTime)',
        {
          headers: { 'Authorization': `Bearer ${googleAccessToken}` }
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          googleAccessToken = null
          return { success: false, error: 'Session expired. Please reconnect.' }
        }
        return { success: false, error: 'Failed to list spreadsheets' }
      }

      const data = await response.json()
      const sheets = data.files.map((file: { id: string; name: string; modifiedTime: string }) => ({
        id: file.id,
        name: file.name,
        modifiedTime: file.modifiedTime,
        url: `https://docs.google.com/spreadsheets/d/${file.id}`
      }))

      return { success: true, data: sheets }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Capture a Google Sheet via Playwright (using published embed URL)
  ipcMain.handle('sheets:capture', async (_, sheetId: string) => {
    try {
      const { chromium } = getPlaywright()
      const browser = await chromium.launch({ headless: true })
      const page = await browser.newPage()

      await page.setViewportSize({ width: 1440, height: 900 })

      // Use the export-as-HTML embed URL for cleaner rendering
      const embedUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/htmlembed`
      await page.goto(embedUrl, { waitUntil: 'networkidle', timeout: 30000 })

      const screenshotBuffer = await page.screenshot({ fullPage: false })
      await browser.close()

      return { success: true, data: screenshotBuffer.toString('base64') }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Check if connected
  ipcMain.handle('sheets:isConnected', async () => {
    return { success: true, data: googleAccessToken !== null }
  })

  // Disconnect — clear stored token
  ipcMain.handle('sheets:disconnect', async () => {
    googleAccessToken = null
    return { success: true }
  })
}

// Called from main.ts when a deep link arrives (kept for backward compatibility)
export function handleSheetsCallback(url: string): string | null {
  const urlObj = new URL(url)
  return urlObj.searchParams.get('code')
}
