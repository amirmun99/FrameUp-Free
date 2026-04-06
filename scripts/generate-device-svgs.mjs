#!/usr/bin/env node
/**
 * Generate SVG device frame assets for all devices in the Frameup library.
 * Each device gets light + dark variants.
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'src', 'assets', 'devices')
mkdirSync(outDir, { recursive: true })

// Color palettes
const light = {
  shell: '#E8E8ED', shellStroke: '#D1D1D6',
  bezel: '#F5F5F7', button: '#D1D1D6',
  island: '#1C1C1E', cameraDot: '#2C2C2E', cameraInner: '#1C1C1E',
  notch: '#1C1C1E',
  keyboard: '#C7C7CC', keyboardKey: '#FFFFFF', keyboardText: '#3A3A3C',
  trackpad: '#D1D1D6', trackpadStroke: '#C7C7CC',
  stand: '#D1D1D6', standStroke: '#C7C7CC',
  chrome: '#F0F0F0', chromeStroke: '#D1D1D6', chromeBtn: '#FF5F57', chromeBtnY: '#FEBC2E', chromeBtnG: '#28C840',
  urlBar: '#E8E8ED', urlText: '#8E8E93',
  tabBar: '#E8E8ED',
}
const dark = {
  shell: '#1C1C1E', shellStroke: '#3A3A3C',
  bezel: '#2C2C2E', button: '#3A3A3C',
  island: '#000000', cameraDot: '#1C1C1E', cameraInner: '#000000',
  notch: '#000000',
  keyboard: '#2C2C2E', keyboardKey: '#3A3A3C', keyboardText: '#E5E5EA',
  trackpad: '#3A3A3C', trackpadStroke: '#48484A',
  stand: '#2C2C2E', standStroke: '#3A3A3C',
  chrome: '#2C2C2E', chromeStroke: '#3A3A3C', chromeBtn: '#FF5F57', chromeBtnY: '#FEBC2E', chromeBtnG: '#28C840',
  urlBar: '#3A3A3C', urlText: '#8E8E93',
  tabBar: '#3A3A3C',
}

// ── Phone SVG (iPhone-style with Dynamic Island) ──
function phoneWithIsland(w, h, sb, cr, c) {
  const bw = w - 12  // bezel inner
  const bh = h - 12
  const islandW = Math.round(w * 0.2)
  const islandH = 28
  const islandX = Math.round((w - islandW) / 2)
  const islandY = sb.y + 9
  const camX = islandX + Math.round(islandW * 0.35)
  const camY = islandY + 14
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${w-1}" height="${h-1}" rx="${cr+5}" ry="${cr+5}" fill="${c.shell}" stroke="${c.shellStroke}" stroke-width="1"/>
  <rect x="6" y="6" width="${bw}" height="${bh}" rx="${cr}" ry="${cr}" fill="${c.bezel}"/>
  <rect x="${sb.x}" y="${sb.y}" width="${sb.width}" height="${sb.height}" rx="${cr-10}" ry="${cr-10}" fill="transparent"/>
  <rect x="-2" y="${Math.round(h*0.2)}" width="3" height="40" rx="1.5" fill="${c.button}"/>
  <rect x="-2" y="${Math.round(h*0.2)+50}" width="3" height="40" rx="1.5" fill="${c.button}"/>
  <rect x="${w-1}" y="${Math.round(h*0.22)}" width="3" height="60" rx="1.5" fill="${c.button}"/>
  <rect x="${islandX}" y="${islandY}" width="${islandW}" height="${islandH}" rx="14" fill="${c.island}"/>
  <circle cx="${camX}" cy="${camY}" r="5" fill="${c.cameraDot}"/>
  <circle cx="${camX}" cy="${camY}" r="3" fill="${c.cameraInner}"/>
</svg>`
}

// ── Phone SVG (with notch - older style) ──
function phoneWithNotch(w, h, sb, cr, c) {
  const bw = w - 12
  const bh = h - 12
  const notchW = Math.round(w * 0.35)
  const notchH = 30
  const notchX = Math.round((w - notchW) / 2)
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${w-1}" height="${h-1}" rx="${cr+5}" ry="${cr+5}" fill="${c.shell}" stroke="${c.shellStroke}" stroke-width="1"/>
  <rect x="6" y="6" width="${bw}" height="${bh}" rx="${cr}" ry="${cr}" fill="${c.bezel}"/>
  <rect x="${sb.x}" y="${sb.y}" width="${sb.width}" height="${sb.height}" rx="${cr-10}" ry="${cr-10}" fill="transparent"/>
  <rect x="-2" y="${Math.round(h*0.2)}" width="3" height="40" rx="1.5" fill="${c.button}"/>
  <rect x="-2" y="${Math.round(h*0.2)+50}" width="3" height="40" rx="1.5" fill="${c.button}"/>
  <rect x="${w-1}" y="${Math.round(h*0.22)}" width="3" height="60" rx="1.5" fill="${c.button}"/>
  <path d="M${notchX} ${sb.y} Q${notchX} ${sb.y+notchH} ${notchX+12} ${sb.y+notchH} L${notchX+notchW-12} ${sb.y+notchH} Q${notchX+notchW} ${sb.y+notchH} ${notchX+notchW} ${sb.y}" fill="${c.notch}"/>
</svg>`
}

// ── Android phone (punch-hole camera) ──
function androidPhone(w, h, sb, cr, c) {
  const bw = w - 12
  const bh = h - 12
  const camX = Math.round(w / 2)
  const camY = sb.y + 12
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${w-1}" height="${h-1}" rx="${cr+5}" ry="${cr+5}" fill="${c.shell}" stroke="${c.shellStroke}" stroke-width="1"/>
  <rect x="6" y="6" width="${bw}" height="${bh}" rx="${cr}" ry="${cr}" fill="${c.bezel}"/>
  <rect x="${sb.x}" y="${sb.y}" width="${sb.width}" height="${sb.height}" rx="${cr-10}" ry="${cr-10}" fill="transparent"/>
  <rect x="${w-1}" y="${Math.round(h*0.22)}" width="3" height="60" rx="1.5" fill="${c.button}"/>
  <circle cx="${camX}" cy="${camY}" r="6" fill="${c.island}"/>
  <circle cx="${camX}" cy="${camY}" r="4" fill="${c.cameraDot}"/>
</svg>`
}

// ── Tablet SVG (iPad-style, no notch) ──
function tablet(w, h, sb, cr, c) {
  const bw = w - 16
  const bh = h - 16
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${w-1}" height="${h-1}" rx="${cr+5}" ry="${cr+5}" fill="${c.shell}" stroke="${c.shellStroke}" stroke-width="1"/>
  <rect x="8" y="8" width="${bw}" height="${bh}" rx="${cr}" ry="${cr}" fill="${c.bezel}"/>
  <rect x="${sb.x}" y="${sb.y}" width="${sb.width}" height="${sb.height}" rx="${Math.min(cr-5, 20)}" ry="${Math.min(cr-5, 20)}" fill="transparent"/>
  <circle cx="${Math.round(w/2)}" cy="${sb.y + 10}" r="4" fill="${c.cameraDot}"/>
</svg>`
}

// ── Laptop SVG (screen + keyboard base) ──
function laptop(w, h, sb, cr, c) {
  const lidH = Math.round(h * 0.68)  // screen portion
  const baseH = h - lidH
  const hingeY = lidH
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Lid -->
  <rect x="0.5" y="0.5" width="${w-1}" height="${lidH-1}" rx="12" ry="12" fill="${c.shell}" stroke="${c.shellStroke}" stroke-width="1"/>
  <rect x="${sb.x - 8}" y="${sb.y - 8}" width="${sb.width + 16}" height="${sb.height + 16}" rx="8" ry="8" fill="${c.bezel}"/>
  <rect x="${sb.x}" y="${sb.y}" width="${sb.width}" height="${sb.height}" rx="4" ry="4" fill="transparent"/>
  <!-- Camera -->
  <circle cx="${Math.round(w/2)}" cy="${Math.round(sb.y/2)}" r="3" fill="${c.cameraDot}"/>
  <!-- Base/keyboard -->
  <path d="M${Math.round(w*0.02)} ${hingeY} L${Math.round(w*0.98)} ${hingeY} L${w} ${h-4} Q${w} ${h} ${w-4} ${h} L4 ${h} Q0 ${h} 0 ${h-4} Z" fill="${c.shell}" stroke="${c.shellStroke}" stroke-width="1"/>
  <!-- Trackpad -->
  <rect x="${Math.round(w*0.35)}" y="${hingeY + Math.round(baseH*0.55)}" width="${Math.round(w*0.3)}" height="${Math.round(baseH*0.35)}" rx="6" ry="6" fill="${c.trackpad}" stroke="${c.trackpadStroke}" stroke-width="0.5"/>
  <!-- Keyboard area hint -->
  <rect x="${Math.round(w*0.08)}" y="${hingeY + Math.round(baseH*0.12)}" width="${Math.round(w*0.84)}" height="${Math.round(baseH*0.38)}" rx="4" ry="4" fill="${c.keyboard}" opacity="0.4"/>
</svg>`
}

// ── Desktop monitor (iMac-style with stand) ──
function desktop(w, h, sb, cr, c) {
  const monitorH = Math.round(h * 0.78)
  const standTopY = monitorH
  const standW = Math.round(w * 0.15)
  const standX = Math.round((w - standW) / 2)
  const baseW = Math.round(w * 0.4)
  const baseX = Math.round((w - baseW) / 2)
  const baseH = Math.round(h * 0.03)
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Monitor -->
  <rect x="0.5" y="0.5" width="${w-1}" height="${monitorH-1}" rx="14" ry="14" fill="${c.shell}" stroke="${c.shellStroke}" stroke-width="1"/>
  <rect x="${sb.x - 10}" y="${sb.y - 10}" width="${sb.width + 20}" height="${sb.height + 20}" rx="8" ry="8" fill="${c.bezel}"/>
  <rect x="${sb.x}" y="${sb.y}" width="${sb.width}" height="${sb.height}" rx="4" ry="4" fill="transparent"/>
  <!-- Camera -->
  <circle cx="${Math.round(w/2)}" cy="${Math.round(sb.y/2)}" r="3" fill="${c.cameraDot}"/>
  <!-- Stand -->
  <path d="M${standX} ${standTopY} L${standX + standW} ${standTopY} L${standX + standW + 10} ${h - baseH} L${standX - 10} ${h - baseH} Z" fill="${c.stand}" stroke="${c.standStroke}" stroke-width="0.5"/>
  <!-- Base -->
  <ellipse cx="${Math.round(w/2)}" cy="${h - Math.round(baseH/2)}" rx="${Math.round(baseW/2)}" ry="${Math.round(baseH/2 + 2)}" fill="${c.stand}" stroke="${c.standStroke}" stroke-width="0.5"/>
</svg>`
}

// ── Browser window chrome ──
function browserWindow(w, h, sb, cr, c, browserName) {
  const chromeH = sb.y
  const btnY = Math.round(chromeH * 0.4)
  const urlBarY = Math.round(chromeH * 0.25)
  const urlBarH = Math.round(chromeH * 0.5)

  // Different browsers have different button positions
  const isArc = browserName === 'arc'
  const btnStartX = isArc ? w - 60 : 16

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Window frame -->
  <rect x="0.5" y="0.5" width="${w-1}" height="${h-1}" rx="10" ry="10" fill="${c.chrome}" stroke="${c.chromeStroke}" stroke-width="1"/>
  <!-- Title bar / chrome -->
  <rect x="1" y="1" width="${w-2}" height="${chromeH}" rx="10" ry="10" fill="${c.chrome}"/>
  <rect x="1" y="${chromeH - 1}" width="${w-2}" height="1" fill="${c.chromeStroke}"/>
  <!-- Traffic light buttons -->
  <circle cx="${btnStartX}" cy="${btnY}" r="6" fill="${c.chromeBtn}"/>
  <circle cx="${btnStartX + 20}" cy="${btnY}" r="6" fill="${c.chromeBtnY}"/>
  <circle cx="${btnStartX + 40}" cy="${btnY}" r="6" fill="${c.chromeBtnG}"/>
  <!-- URL bar -->
  <rect x="${isArc ? 16 : 80}" y="${urlBarY}" width="${isArc ? w - 100 : w - 110}" height="${urlBarH}" rx="${Math.round(urlBarH/2)}" fill="${c.urlBar}"/>
  <!-- Screen area -->
  <rect x="${sb.x}" y="${sb.y}" width="${sb.width}" height="${sb.height}" fill="transparent"/>
</svg>`
}

// ── Device definitions ──
const deviceDefs = [
  // iPhones
  { id: 'iphone-17', name: 'iPhone 17', cat: 'iphone', w: 433, h: 882, sb: {x:21,y:21,w:391,h:844}, cr: 55, fn: phoneWithIsland, tier: 'free' },
  { id: 'iphone-17-pro', name: 'iPhone 17 Pro', cat: 'iphone', w: 433, h: 894, sb: {x:21,y:21,w:391,h:856}, cr: 55, fn: phoneWithIsland, tier: 'pro' },
  { id: 'iphone-17-pro-max', name: 'iPhone 17 Pro Max', cat: 'iphone', w: 463, h: 952, sb: {x:22,y:22,w:419,h:912}, cr: 58, fn: phoneWithIsland, tier: 'pro' },
  { id: 'iphone-16', name: 'iPhone 16', cat: 'iphone', w: 425, h: 874, sb: {x:20,y:20,w:385,h:838}, cr: 53, fn: phoneWithIsland, tier: 'pro' },
  { id: 'iphone-16-pro', name: 'iPhone 16 Pro', cat: 'iphone', w: 433, h: 882, sb: {x:21,y:21,w:391,h:844}, cr: 55, fn: phoneWithIsland, tier: 'pro' },
  { id: 'iphone-se', name: 'iPhone SE', cat: 'iphone', w: 400, h: 800, sb: {x:18,y:80,w:364,h:644}, cr: 40, fn: phoneWithNotch, tier: 'pro' },

  // iPads
  { id: 'ipad-pro-13', name: 'iPad Pro 13"', cat: 'ipad', w: 1050, h: 1400, sb: {x:30,y:30,w:990,h:1340}, cr: 30, fn: tablet, tier: 'pro' },
  { id: 'ipad-air-11', name: 'iPad Air 11"', cat: 'ipad', w: 870, h: 1194, sb: {x:28,y:28,w:814,h:1138}, cr: 28, fn: tablet, tier: 'pro' },
  { id: 'ipad-mini', name: 'iPad mini', cat: 'ipad', w: 768, h: 1064, sb: {x:26,y:26,w:716,h:1012}, cr: 26, fn: tablet, tier: 'pro' },

  // Android
  { id: 'pixel-9-pro', name: 'Pixel 9 Pro', cat: 'android', w: 420, h: 910, sb: {x:20,y:20,w:380,h:874}, cr: 48, fn: androidPhone, tier: 'pro' },
  { id: 'galaxy-s25-ultra', name: 'Galaxy S25 Ultra', cat: 'android', w: 440, h: 940, sb: {x:18,y:18,w:404,h:908}, cr: 42, fn: androidPhone, tier: 'pro' },
  { id: 'galaxy-z-fold', name: 'Galaxy Z Fold', cat: 'android', w: 560, h: 740, sb: {x:20,y:20,w:520,h:704}, cr: 36, fn: androidPhone, tier: 'pro' },

  // Mac
  { id: 'macbook-pro-16', name: 'MacBook Pro 16"', cat: 'mac', w: 1120, h: 740, sb: {x:60,y:30,w:1000,h:640}, cr: 12, fn: laptop, tier: 'pro' },
  { id: 'macbook-air-15', name: 'MacBook Air 15"', cat: 'mac', w: 1060, h: 700, sb: {x:56,y:28,w:948,h:608}, cr: 12, fn: laptop, tier: 'pro' },
  { id: 'imac-24', name: 'iMac 24"', cat: 'mac', w: 1080, h: 900, sb: {x:48,y:40,w:984,h:620}, cr: 14, fn: desktop, tier: 'pro' },

  // Windows
  { id: 'surface-pro', name: 'Surface Pro', cat: 'windows', w: 960, h: 680, sb: {x:30,y:30,w:900,h:620}, cr: 20, fn: tablet, tier: 'pro' },
  { id: 'surface-laptop', name: 'Surface Laptop', cat: 'windows', w: 1060, h: 710, sb: {x:56,y:28,w:948,h:618}, cr: 12, fn: laptop, tier: 'pro' },
  { id: 'dell-xps', name: 'Dell XPS', cat: 'windows', w: 1040, h: 690, sb: {x:48,y:26,w:944,h:602}, cr: 10, fn: laptop, tier: 'pro' },

  // Chromebook
  { id: 'pixelbook-go', name: 'Pixelbook Go', cat: 'chromebook', w: 1020, h: 680, sb: {x:50,y:28,w:920,h:590}, cr: 10, fn: laptop, tier: 'pro' },
  { id: 'chromebook-generic', name: 'Chromebook', cat: 'chromebook', w: 1000, h: 670, sb: {x:46,y:26,w:908,h:582}, cr: 10, fn: laptop, tier: 'pro' },

  // Browser windows
  { id: 'browser-chrome', name: 'Chrome', cat: 'browser', w: 1200, h: 800, sb: {x:1,y:52,w:1198,h:747}, cr: 10, fn: (w,h,sb,cr,c) => browserWindow(w,h,sb,cr,c,'chrome'), tier: 'free' },
  { id: 'browser-safari', name: 'Safari', cat: 'browser', w: 1200, h: 800, sb: {x:1,y:52,w:1198,h:747}, cr: 10, fn: (w,h,sb,cr,c) => browserWindow(w,h,sb,cr,c,'safari'), tier: 'pro' },
  { id: 'browser-firefox', name: 'Firefox', cat: 'browser', w: 1200, h: 800, sb: {x:1,y:52,w:1198,h:747}, cr: 10, fn: (w,h,sb,cr,c) => browserWindow(w,h,sb,cr,c,'firefox'), tier: 'pro' },
  { id: 'browser-arc', name: 'Arc', cat: 'browser', w: 1200, h: 800, sb: {x:1,y:52,w:1198,h:747}, cr: 10, fn: (w,h,sb,cr,c) => browserWindow(w,h,sb,cr,c,'arc'), tier: 'pro' },
]

// Generate each device
let count = 0
for (const d of deviceDefs) {
  const sb = { x: d.sb.x, y: d.sb.y, width: d.sb.w, height: d.sb.h }

  const lightSvg = d.fn(d.w, d.h, sb, d.cr, light)
  const darkSvg = d.fn(d.w, d.h, sb, d.cr, dark)

  writeFileSync(join(outDir, `${d.id}-light.svg`), lightSvg)
  writeFileSync(join(outDir, `${d.id}-dark.svg`), darkSvg)
  count++
}

console.log(`Generated ${count} devices (${count * 2} SVG files) in ${outDir}`)
