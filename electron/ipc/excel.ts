import { ipcMain } from 'electron'
import { createRequire } from 'module'
import { join } from 'path'
import { acquirePlaywright } from './playwrightSemaphore'

// Resolve playwright from the project root node_modules
function getPlaywright() {
  const require = createRequire(join(process.cwd(), 'package.json'))
  return require('playwright') as typeof import('playwright')
}

interface ExcelCaptureInput {
  html: string
  width?: number
}

// Strip script tags, event handlers, and javascript: URLs from HTML
// to prevent XSS when rendering user-supplied Excel/CSV markup in Playwright.
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?\s*script\b[^>]*>/gi, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'href="#"')
    .replace(/src\s*=\s*["']data:(?!image\/)[^"']*["']/gi, '')
}

export function registerExcelHandlers(): void {
  ipcMain.handle('excel:capture', async (_, input: ExcelCaptureInput) => {
    const { chromium } = getPlaywright()
    const releasePlaywright = await acquirePlaywright()
    let browser: import('playwright').Browser | undefined
    try {
      browser = await chromium.launch({ headless: true })
      const page = await browser.newPage()

      await page.setViewportSize({
        width: input.width ?? 1200,
        height: 800
      })

      await page.setContent(sanitizeHtml(input.html), { waitUntil: 'networkidle', timeout: 15000 })

      const table = page.locator('table').first()
      const hasTable = await table.count() > 0

      let buffer: Buffer
      if (hasTable) {
        buffer = await table.screenshot({ type: 'png' })
      } else {
        buffer = await page.screenshot({ type: 'png', fullPage: true })
      }

      return { success: true, data: buffer.toString('base64') }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    } finally {
      await browser?.close().catch(() => {})
      releasePlaywright()
    }
  })
}
