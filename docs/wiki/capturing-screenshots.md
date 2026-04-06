# Capturing Screenshots

Frameup supports multiple capture sources. Navigate to the **Capture** page from the sidebar to choose a source.

## URL Capture

Capture any public website by entering its URL.

**Settings:**
- **Viewport** — Desktop (1440x900), Tablet (768x1024), or Mobile (390x844)
- **Capture mode** — Viewport (visible area), Full page (entire scrollable page), or Selector (specific CSS element)
- **Wait for selector** — Wait for a specific element to appear before capturing
- **Delay after load** — Extra wait time (in ms) for animations or lazy content
- **Remove cookie banners** — Automatically hide cookie consent popups
- **Pre-capture script** — Run custom JavaScript before taking the screenshot

**Tips:**
- Make sure the URL starts with `https://` or `http://`
- For sites behind login walls, use the Upload source instead
- Full page captures may be very tall — consider Viewport mode for cleaner mockups

## Upload Screenshot

Upload an existing screenshot or image file from your computer.

**Supported formats:** PNG, JPG, JPEG, WebP, GIF

You can also **drag and drop** images directly onto the Frameup window from anywhere.

## Local File

Capture a local HTML file or image. Frameup renders HTML files using a browser engine for pixel-perfect results.

**Supported formats:** HTML, HTM, PNG, JPG, JPEG, WebP, GIF

## iOS Simulator

Capture directly from a running iOS Simulator on macOS.

**Requirements:**
- macOS only
- Xcode with Simulator installed
- At least one simulator device booted

**How to use:**
1. Open Xcode and boot a simulator
2. In Frameup, select **iOS Simulator** as the source
3. Choose the booted device from the list
4. Click **Capture**

## Sitemap Scraper

Batch capture pages from an entire website using its sitemap.

**How to use:**
1. Enter the domain (e.g., `example.com`)
2. Frameup fetches and parses the sitemap XML
3. Select pages to capture using checkboxes
4. Choose viewport size (Desktop or Mobile)
5. Click **Capture Selected**

A progress bar shows capture status. All captures are saved to your library.

## Notion

Capture Notion pages as pixel-perfect browser screenshots.

**Setup:**
1. Copy `.env.example` to `.env` and fill in `VITE_NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET`
2. Click **Connect Notion** to open a browser window
3. Log in to your Notion account if prompted
4. Select the pages you want Frameup to access and click **Allow**
5. The browser closes automatically and your pages appear in the list

**Capture settings:**
- **Viewport** — Mobile, Tablet, or Desktop
- **Mode** — Viewport (visible area) or Full page (entire page)
- **Theme** — Light or Dark mode
- **Hide navigation** — Remove Notion's sidebar and toolbar for cleaner captures

**Batch capture:** Select multiple pages with checkboxes, then click **Capture Selected**. A progress bar tracks the batch.

## Google Sheets

Capture Google Sheets as styled screenshots.

**Setup:**
1. Copy `.env.example` to `.env` and fill in `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Click **Connect Google** and follow the OAuth flow

## Excel / CSV

Upload and capture spreadsheets as styled screenshots.

**Supported formats:** .xlsx, .xls, .csv
