import { ipcMain, BrowserWindow } from 'electron'
import { createRequire } from 'module'
import { join } from 'path'
import { acquirePlaywright } from './playwrightSemaphore'

// Fix 7: Block private/internal IP ranges to prevent SSRF
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

function getPlaywright() {
  const require = createRequire(join(process.cwd(), 'package.json'))
  return require('playwright') as typeof import('playwright')
}

interface SitemapCaptureJob {
  url: string
  captureMode: 'fullpage' | 'viewport' | 'selector'
  selector?: string
  viewportWidth?: number
  viewportHeight?: number
}

export function registerSitemapHandlers(): void {
  // Fetch and parse sitemap.xml
  ipcMain.handle('sitemap:fetch', async (_, domain: string) => {
    try {
      // Validate domain format
      const trimmed = domain.trim()
      if (!trimmed) {
        return { success: false, error: 'Please enter a domain' }
      }

      // Strip protocol if user included it
      const domainOnly = trimmed.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

      // Basic domain validation
      if (!domainOnly.includes('.') || /\s/.test(domainOnly)) {
        return { success: false, error: 'Invalid domain format — enter something like "example.com"' }
      }

      // Normalize domain
      const baseUrl = `https://${domainOnly}`

      // Try fetching sitemap.xml
      let urls: string[]
      try {
        urls = await fetchSitemapXml(`${baseUrl}/sitemap.xml`)
      } catch (fetchErr) {
        const msg = (fetchErr as Error).message ?? ''
        if (msg.includes('fetch failed') || msg.includes('ENOTFOUND') || msg.includes('ERR_NAME_NOT_RESOLVED')) {
          return { success: false, error: `Could not reach "${domainOnly}" — check spelling and your internet connection` }
        }
        return { success: false, error: `Failed to fetch sitemap: ${msg}` }
      }

      // If no results, try robots.txt for sitemap location
      if (urls.length === 0) {
        const robotsUrl = `${baseUrl}/robots.txt`
        try {
          const response = await fetch(robotsUrl)
          if (response.ok) {
            const text = await response.text()
            const sitemapMatch = text.match(/Sitemap:\s*(.+)/i)
            if (sitemapMatch) {
              urls = await fetchSitemapXml(sitemapMatch[1].trim())
            }
          }
        } catch {
          // robots.txt not available
        }
      }

      if (urls.length === 0) {
        return { success: true, data: [], warning: 'No sitemap found — this site may not have one' }
      }

      return { success: true, data: urls }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Batch capture URLs
  ipcMain.handle('sitemap:captureQueue', async (event, jobs: SitemapCaptureJob[]) => {
    const { chromium } = getPlaywright()
    const releasePlaywright = await acquirePlaywright()
    let browser: import('playwright').Browser | undefined
    try {
      browser = await chromium.launch({ headless: true })
      const results: string[] = []

      const mainWindow = BrowserWindow.fromWebContents(event.sender)

      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i]

        // Emit progress
        if (mainWindow) {
          mainWindow.webContents.send('sitemap:progress', {
            current: i + 1,
            total: jobs.length,
            url: job.url
          })
        }

        try {
          // Validate URL scheme and block private IP ranges
          const parsed = new URL(job.url)
          if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            results.push('')
            continue
          }
          if (isPrivateHostname(parsed.hostname)) {
            results.push('')
            continue
          }

          const page = await browser.newPage()
          await page.setViewportSize({
            width: job.viewportWidth ?? 1440,
            height: job.viewportHeight ?? 900
          })

          await page.goto(job.url, { waitUntil: 'networkidle', timeout: 30000 })

          let screenshotBuffer: Buffer
          if (job.captureMode === 'selector' && job.selector) {
            screenshotBuffer = await page.locator(job.selector).screenshot()
          } else {
            screenshotBuffer = await page.screenshot({
              fullPage: job.captureMode === 'fullpage'
            })
          }

          results.push(screenshotBuffer.toString('base64'))
          await page.close()
        } catch {
          results.push('') // Empty string for failed captures
        }
      }

      return { success: true, data: results }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    } finally {
      await browser?.close().catch(() => {})
      releasePlaywright()
    }
  })
}

async function fetchSitemapXml(url: string): Promise<string[]> {
  const response = await fetch(url)
  if (!response.ok) return []

  const xml = await response.text()
  const urls: string[] = []

  // Check if this is a sitemap index
  const sitemapIndexMatches = xml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)
  const indexUrls = [...sitemapIndexMatches].map((m) => m[1])

  if (indexUrls.length > 0) {
    // Recursively fetch child sitemaps (limit to first 5 to avoid huge fetches)
    for (const childUrl of indexUrls.slice(0, 5)) {
      const childUrls = await fetchSitemapXml(childUrl)
      urls.push(...childUrls)
    }
  } else {
    // Regular sitemap — extract <loc> URLs
    const locMatches = xml.matchAll(/<loc>([^<]+)<\/loc>/g)
    for (const match of locMatches) {
      urls.push(match[1])
    }
  }

  return urls
}
