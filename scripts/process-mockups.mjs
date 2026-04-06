/**
 * Process mockup SVGs → PNGs + metadata JSON
 *
 * Each input SVG contains a base64-encoded PNG via a <pattern> fill.
 * The PNG already has transparency: both the background and screen area
 * are transparent (alpha=0), while the device frame (bezels, body) is opaque.
 *
 * This script:
 *   1. Extracts the PNG from the SVG
 *   2. Resizes to a reasonable size
 *   3. Detects the screen rectangle using alpha-based flood-fill
 *      (screen = interior transparent region NOT connected to image borders)
 *   4. Estimates corner radius
 *   5. Outputs a PNG + metadata entry
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises'
import { join, basename } from 'path'
import sharp from 'sharp'

const MOCKUPS_DIR = join(process.cwd(), 'mockups')
const OUTPUT_DIR = join(process.cwd(), 'public', 'assets', 'devices')
const MAX_LONG_EDGE = 1200 // Cap longest dimension for reasonable file sizes

// Folders to process (skip watches)
const FOLDERS = [
  { dir: 'smartphones', category: 'phone' },
  { dir: 'tablets', category: 'tablet' },
  { dir: 'laptops-desktops', category: 'laptop' },
  { dir: 'displays', category: 'display' }
]

// Brand prefixes to strip from filenames
const BRAND_PREFIXES = [
  'Apple_', 'Samsung_', 'Google_', 'Microsoft_', 'Dell_', 'Sony_', 'Snony_',
  'HTC_', 'Huawei_', 'Motorola_', 'Nokia_', 'Apple-'
]

function normalizeId(filename) {
  let name = filename.replace(/\.svg$/i, '')
  for (const prefix of BRAND_PREFIXES) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length)
      break
    }
  }
  // Replace underscores, spaces, and multiple hyphens with single hyphen
  name = name.replace(/[_\s]+/g, '-').replace(/-+/g, '-').toLowerCase()
  return name
}

function extractDisplayName(filename) {
  let name = filename.replace(/\.svg$/i, '')
  name = name.replace(/[_-]+/g, ' ')
  name = name.replace(/^Apple\s+/i, '')
  return name
}

function extractColor(filename) {
  const name = filename.replace(/\.svg$/i, '')
  const colors = [
    'Black', 'White', 'Gold', 'Silver', 'Space Grey', 'Space Gray',
    'Rose Gold', 'Jet Black', 'Matte Black', 'Red', 'Blue', 'Green',
    'Yellow', 'Purple', 'Midnight Green', 'Coral', 'Pink'
  ]
  for (const color of colors) {
    if (name.endsWith(color.replace(/\s/g, '_')) || name.endsWith(color.replace(/\s/g, '-'))) {
      return color
    }
  }
  return ''
}

/**
 * Extract base64 PNG data from SVG that uses pattern fill
 */
function extractPngFromSvg(svgContent) {
  const widthMatch = svgContent.match(/width="(\d+)"/)
  const heightMatch = svgContent.match(/height="(\d+)"/)
  const width = widthMatch ? parseInt(widthMatch[1]) : 0
  const height = heightMatch ? parseInt(heightMatch[1]) : 0

  const base64Match = svgContent.match(/xlink:href="data:image\/png;base64,([^"]+)"/)
  if (!base64Match) {
    const altMatch = svgContent.match(/href="data:image\/png;base64,([^"]+)"/)
    if (!altMatch) return null
    return { width, height, base64: altMatch[1] }
  }
  return { width, height, base64: base64Match[1] }
}

/**
 * Detect the screen rectangle using alpha-channel flood-fill.
 *
 * Both the background and screen are transparent (alpha=0).
 * The device frame (bezels) is opaque (alpha>0).
 * The screen is the transparent region NOT connected to the image borders.
 *
 * Algorithm:
 * 1. Flood-fill from all transparent border pixels to mark them as "background"
 * 2. Remaining transparent pixels are "interior" (the screen)
 * 3. Return the bounding box of interior transparent pixels
 */
function detectScreenBounds(pixels, width, height, channels) {
  const isTransparent = (x, y) => {
    const idx = (y * width + x) * channels
    return pixels[idx + 3] < 128 // alpha < 128 = transparent enough
  }

  // mask: 0 = unvisited transparent, 1 = background (border-connected), 2 = opaque
  const mask = new Uint8Array(width * height)

  // Mark opaque pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isTransparent(x, y)) {
        mask[y * width + x] = 2
      }
    }
  }

  // BFS from all border transparent pixels
  const queue = new Int32Array(width * height) // pre-allocate max size
  let head = 0
  let tail = 0

  // Seed with border transparent pixels
  for (let x = 0; x < width; x++) {
    if (mask[x] === 0) { mask[x] = 1; queue[tail++] = x }
    const bi = (height - 1) * width + x
    if (mask[bi] === 0) { mask[bi] = 1; queue[tail++] = bi }
  }
  for (let y = 1; y < height - 1; y++) {
    const li = y * width
    if (mask[li] === 0) { mask[li] = 1; queue[tail++] = li }
    const ri = y * width + (width - 1)
    if (mask[ri] === 0) { mask[ri] = 1; queue[tail++] = ri }
  }

  // BFS to flood-fill background transparent pixels
  while (head < tail) {
    const idx = queue[head++]
    const y = Math.floor(idx / width)
    const x = idx % width

    // Check 4 neighbors
    if (x > 0 && mask[idx - 1] === 0) { mask[idx - 1] = 1; queue[tail++] = idx - 1 }
    if (x < width - 1 && mask[idx + 1] === 0) { mask[idx + 1] = 1; queue[tail++] = idx + 1 }
    if (y > 0 && mask[idx - width] === 0) { mask[idx - width] = 1; queue[tail++] = idx - width }
    if (y < height - 1 && mask[idx + width] === 0) { mask[idx + width] = 1; queue[tail++] = idx + width }
  }

  // Find bounding box of interior transparent pixels (mask === 0)
  let minX = width, maxX = 0, minY = height, maxY = 0
  let count = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] === 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        count++
      }
    }
  }

  if (count < 100) {
    // Fallback: no distinct interior transparent region found.
    // Try detecting using the device outline approach.
    return detectScreenFromDeviceOutline(pixels, width, height, channels)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  }
}

/**
 * Fallback: detect screen by finding the opaque device outline,
 * then looking for the transparent region inside it.
 * Uses row/column scanning to find the interior.
 */
function detectScreenFromDeviceOutline(pixels, width, height, channels) {
  const isOpaque = (x, y) => {
    const idx = (y * width + x) * channels
    return pixels[idx + 3] >= 128
  }

  // Find device bounding box (opaque pixels)
  let devLeft = width, devRight = 0, devTop = height, devBottom = 0

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (isOpaque(x, y)) {
        if (x < devLeft) devLeft = x
        if (x > devRight) devRight = x
        if (y < devTop) devTop = y
        if (y > devBottom) devBottom = y
      }
    }
  }

  if (devRight <= devLeft || devBottom <= devTop) {
    // No opaque pixels found, return center 50%
    return {
      x: Math.floor(width * 0.25),
      y: Math.floor(height * 0.25),
      width: Math.floor(width * 0.5),
      height: Math.floor(height * 0.5)
    }
  }

  // Scan inward from device edges to find the transparent screen
  const cx = Math.floor((devLeft + devRight) / 2)
  const cy = Math.floor((devTop + devBottom) / 2)

  // Scan left from center
  let left = cx
  while (left > devLeft && !isOpaque(left - 1, cy)) left--

  // Scan right from center
  let right = cx
  while (right < devRight && !isOpaque(right + 1, cy)) right++

  // Scan up from center
  let top = cy
  while (top > devTop && !isOpaque(cx, top - 1)) top--

  // Scan down from center
  let bottom = cy
  while (bottom < devBottom && !isOpaque(cx, bottom + 1)) bottom++

  return {
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1
  }
}

/**
 * Estimate corner radius by scanning along the screen boundary diagonal.
 * Check the top-left corner of the screen: count how many pixels along
 * the diagonal are opaque (part of the rounded corner of the bezel).
 */
function estimateCornerRadius(pixels, width, height, channels, bounds) {
  const isTransparent = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false
    const idx = (y * width + x) * channels
    return pixels[idx + 3] < 128
  }

  // Check top-left corner of screen bounds: go diagonally inward
  // until we find a transparent pixel
  let radius = 0
  const maxCheck = Math.min(bounds.width, bounds.height, 100)
  for (let d = 0; d < maxCheck; d++) {
    const px = bounds.x + d
    const py = bounds.y + d
    if (isTransparent(px, py)) break
    radius = d + 1
  }

  return radius
}

async function processFile(svgPath, category) {
  const filename = basename(svgPath)
  const id = normalizeId(filename)
  const displayName = extractDisplayName(filename)
  const color = extractColor(filename)

  console.log(`  Processing: ${filename} → ${id}.png`)

  const svgContent = await readFile(svgPath, 'utf-8')
  const extracted = extractPngFromSvg(svgContent)
  if (!extracted) {
    console.warn(`    ⚠ Could not extract PNG from ${filename}, skipping`)
    return null
  }

  const pngBuffer = Buffer.from(extracted.base64, 'base64')

  // Get image info
  const metadata = await sharp(pngBuffer).metadata()
  const origWidth = metadata.width
  const origHeight = metadata.height

  // Resize if needed
  let resizeWidth = origWidth
  let resizeHeight = origHeight
  const longEdge = Math.max(origWidth, origHeight)
  if (longEdge > MAX_LONG_EDGE) {
    const scale = MAX_LONG_EDGE / longEdge
    resizeWidth = Math.round(origWidth * scale)
    resizeHeight = Math.round(origHeight * scale)
  }

  // Get raw pixels (ensure RGBA)
  const { data: rawPixels, info } = await sharp(pngBuffer)
    .resize(resizeWidth, resizeHeight)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = Buffer.from(rawPixels)
  const w = info.width
  const h = info.height
  const ch = info.channels

  // Detect screen bounds using alpha-based flood-fill
  const screenBounds = detectScreenBounds(pixels, w, h, ch)

  // Validate screen bounds
  const screenArea = screenBounds.width * screenBounds.height
  const imageArea = w * h
  const ratio = screenArea / imageArea
  if (ratio < 0.05) {
    console.warn(`    ⚠ Screen area too small (${Math.round(ratio * 100)}% of image), skipping`)
    return null
  }
  if (ratio > 0.95) {
    console.warn(`    ⚠ Screen area too large (${Math.round(ratio * 100)}% of image), detection may have failed, skipping`)
    return null
  }

  // Estimate corner radius
  const cornerRadius = estimateCornerRadius(pixels, w, h, ch, screenBounds)

  // Write output PNG (the source already has correct transparency)
  const outputPath = join(OUTPUT_DIR, `${id}.png`)
  await sharp(pixels, { raw: { width: w, height: h, channels: ch } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath)

  const stats = await sharp(outputPath).metadata()

  return {
    id,
    name: displayName,
    color,
    originalFile: filename,
    category,
    width: w,
    height: h,
    screenBounds: {
      x: screenBounds.x,
      y: screenBounds.y,
      width: screenBounds.width,
      height: screenBounds.height
    },
    cornerRadius: Math.max(cornerRadius, Math.round(screenBounds.width * 0.02)),
    fileSize: stats.size
  }
}

async function main() {
  console.log('=== Frameup Mockup Processor ===\n')

  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true })

  const allDevices = []
  let processed = 0
  let skipped = 0

  for (const { dir, category } of FOLDERS) {
    const folderPath = join(MOCKUPS_DIR, dir)
    console.log(`\n📁 Processing ${dir}/ (category: ${category})`)

    let files
    try {
      files = await readdir(folderPath)
    } catch {
      console.warn(`  ⚠ Folder not found: ${folderPath}`)
      continue
    }

    const svgFiles = files.filter((f) => f.endsWith('.svg')).sort()
    console.log(`  Found ${svgFiles.length} SVG files`)

    for (const file of svgFiles) {
      try {
        const result = await processFile(join(folderPath, file), category)
        if (result) {
          allDevices.push(result)
          processed++
        } else {
          skipped++
        }
      } catch (err) {
        console.error(`  ✗ Error processing ${file}:`, err.message)
        skipped++
      }
    }
  }

  // Write metadata
  const metadataPath = join(process.cwd(), 'device-metadata.json')
  await writeFile(metadataPath, JSON.stringify(allDevices, null, 2))

  console.log(`\n=== Done ===`)
  console.log(`Processed: ${processed}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Metadata: ${metadataPath}`)
  console.log(`Output: ${OUTPUT_DIR}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
