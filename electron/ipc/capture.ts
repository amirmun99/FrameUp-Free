import { ipcMain, dialog } from 'electron'
import { readFile } from 'fs/promises'
import { createRequire } from 'module'
import { join, resolve, extname } from 'path'
import { acquirePlaywright } from './playwrightSemaphore'

// Resolve playwright from the project root node_modules, not from out/main/
function getPlaywright() {
  const require = createRequire(join(process.cwd(), 'package.json'))
  return require('playwright') as typeof import('playwright')
}

// Fix 7: Block requests to private/loopback IP ranges to prevent SSRF
function isPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return (
    h === 'localhost' ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^::1$/.test(h) ||
    /^fc00:/i.test(h) ||
    /^fe80:/i.test(h) ||
    /^0\./.test(h)
  )
}

// Fix 10: Strip filesystem paths from error messages before returning to renderer
function sanitizeError(msg: string): string {
  return msg
    .replace(/(?:\/[^\s:]+)+/g, '[path]')
    .replace(/[A-Za-z]:\\[^\s]+/g, '[path]')
}

interface CaptureURLOptions {
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

export function registerCaptureHandlers(): void {
  ipcMain.handle('capture:url', async (_, options: CaptureURLOptions) => {
    // Validate before acquiring the semaphore
    let parsed: URL
    try {
      parsed = new URL(options.url)
    } catch {
      return { success: false, error: 'Invalid URL', code: 'INVALID_URL' }
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { success: false, error: 'Only http:// and https:// URLs are supported', code: 'INVALID_URL' }
    }
    if (isPrivateHostname(parsed.hostname)) {
      return { success: false, error: 'Capturing internal network addresses is not allowed', code: 'INVALID_URL' }
    }

    const { chromium } = getPlaywright()
    const releasePlaywright = await acquirePlaywright()
    let browser: import('playwright').Browser | undefined
    try {
      browser = await chromium.launch({ headless: true })

      const vpWidth = options.viewportWidth || 1440
      const vpHeight = options.viewportHeight || 900
      const deviceScaleFactor = vpWidth <= 1024 ? 2 : 1

      const context = await browser.newContext({
        viewport: { width: vpWidth, height: vpHeight },
        deviceScaleFactor
      })
      const page = await context.newPage()

      await page.goto(options.url, { waitUntil: 'networkidle', timeout: 30000 })

      if (options.delayAfterLoad) {
        await page.waitForTimeout(options.delayAfterLoad)
      }

      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 })
      }

      if (options.captureMode === 'fullpage') {
        await page.evaluate(async () => {
          const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
          const scrollHeight = document.body.scrollHeight
          const viewportHeight = window.innerHeight
          for (let y = 0; y < scrollHeight; y += viewportHeight) {
            window.scrollTo(0, y)
            await delay(200)
          }
          window.scrollTo(0, 0)
          await delay(300)
        })
      }

      if (options.removeCookieBanners) {
        await page.evaluate(() => {
          const selectors = [
            '[class*="cookie"]',
            '[id*="cookie"]',
            '[class*="consent"]',
            '[id*="consent"]',
            '[class*="gdpr"]'
          ]
          selectors.forEach((sel) =>
            document
              .querySelectorAll(sel)
              .forEach((el) => ((el as HTMLElement).style.display = 'none'))
          )
        })
      }

      // Fix 8: Validate preCaptureScript — block obvious network exfiltration patterns
      if (options.preCaptureScript && options.preCaptureScript.length <= 5000) {
        const script = options.preCaptureScript
        const blocked = /\bfetch\s*\(|\bXMLHttpRequest\b|\bnavigator\.sendBeacon\b|\bimport\s*\(|\beval\s*\(/i.test(script)
        if (!blocked) {
          await page.evaluate(options.preCaptureScript)
        }
      }

      let screenshotBuffer: Buffer

      if (options.captureMode === 'selector' && options.selector) {
        const element = page.locator(options.selector)
        screenshotBuffer = await element.screenshot()
      } else {
        screenshotBuffer = await page.screenshot({
          fullPage: options.captureMode === 'fullpage'
        })
      }

      return {
        success: true,
        data: screenshotBuffer.toString('base64')
      }
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (msg.includes('ERR_NAME_NOT_RESOLVED') || msg.includes('ERR_CONNECTION_REFUSED')) {
        return { success: false, error: 'Could not connect — check the URL and your internet connection', code: 'NETWORK_ERROR' }
      }
      if (msg.includes('ERR_INVALID_URL') || msg.includes('ERR_ABORTED')) {
        return { success: false, error: 'Invalid URL — make sure it starts with https://', code: 'INVALID_URL' }
      }
      if (msg.includes('Timeout') || msg.includes('timeout')) {
        return { success: false, error: 'Page took too long to load (30s timeout)', code: 'TIMEOUT' }
      }
      if (msg.includes('ERR_CERT') || msg.includes('ERR_SSL')) {
        return { success: false, error: 'SSL certificate error — the site may have security issues', code: 'SSL_ERROR' }
      }
      return { success: false, error: sanitizeError(msg), code: 'UNKNOWN' }
    } finally {
      await browser?.close().catch(() => {})
      releasePlaywright()
    }
  })

  ipcMain.handle('capture:file', async (_, filePath: string) => {
    try {
      // If no path provided, always use native dialog (safest path)
      if (!filePath) {
        const result = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [
            { name: 'Images & HTML', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'html', 'htm'] }
          ]
        })
        if (result.canceled || result.filePaths.length === 0) {
          return { success: false, error: 'Cancelled' }
        }
        filePath = result.filePaths[0]
      }

      // Fix 6: Validate extension — only allow safe image/HTML extensions.
      // Prevents the renderer from requesting arbitrary files (SSH keys, .env, DBs, etc.)
      const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.html', '.htm'])
      const ext = extname(resolve(filePath)).toLowerCase()
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return { success: false, error: 'Unsupported file type', code: 'INVALID_FILE' }
      }

      // For image files, read directly
      if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
        const buffer = await readFile(filePath)
        return { success: true, data: buffer.toString('base64') }
      }

      // For HTML files, render via Playwright
      const { chromium } = getPlaywright()
      const browser = await chromium.launch({ headless: true })
      const page = await browser.newPage()
      await page.goto(`file://${filePath}`, { waitUntil: 'networkidle', timeout: 15000 })
      const screenshotBuffer = await page.screenshot({ fullPage: true })
      await browser.close()

      return { success: true, data: screenshotBuffer.toString('base64') }
    } catch (err) {
      // Fix 10: Sanitize error message
      return { success: false, error: sanitizeError((err as Error).message) }
    }
  })
}
