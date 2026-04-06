# Frameup Free

**Free, open-source screenshot mockup tool for Mac and Windows.**

Wrap your app screenshots in beautiful device frames, style them with backgrounds and text overlays, and export polished visuals for your App Store listing, Product Hunt launch, or website — no account required, no subscription, everything stored locally on your machine.

> **Beta** — actively developed. [Report issues here](https://github.com/amirmun99/FrameUp-Free/issues)

---

## Features

**Capture**
- URL/website capture via Playwright (full-page, viewport, or CSS selector)
- Drag-and-drop image upload
- Local file picker
- iOS Simulator screenshots via `xcrun simctl`
- Notion page capture
- Google Sheets capture
- Excel / CSV table capture
- Sitemap batch capture with progress tracking

**Editor**
- 24 device frames — iPhone 17 Pro Max through iPhone SE, iPad Pro 13", MacBook Pro 16", iMac 24", Chrome, Safari, Firefox, Arc browsers, Galaxy S25 Ultra, Galaxy Z Fold, Pixel 9 Pro, Surface Pro, Dell XPS, Chromebook
- Light and dark variants for every device
- 50+ background presets — gradients, solid colours, mesh, transparent, custom image
- Text overlays with font, size, colour, and alignment controls
- Badge overlays — App Store, Play Store, Mac App Store, Product Hunt, custom image
- Device shadow and screenshot corner radius controls
- Zoom to cursor, canvas pan

**Export**
- PNG or WebP
- Single image or batch export packs (App Store, Play Store, Mac App Store, social media sizes)
- Batch capture + export across an entire sitemap

**Projects & Library**
- Save and reopen canvas configurations as projects
- Capture library with thumbnail preview and search
- All data stored locally in SQLite — no cloud, no account

**Settings**
- Configurable data directory — point captures and projects to any folder (Dropbox, external drive, etc.)

---

## Setup

**Requirements:** Node.js 20+, macOS or Windows

```bash
git clone https://github.com/amirmun99/FrameUp-Free.git
cd FrameUp-Free
npm install
npm run dev
```

The app opens in a desktop window. No environment variables or account setup required.

**Optional integrations** (copy `.env.example` to `.env` and fill in credentials):
- Notion capture — requires a Notion OAuth app (`VITE_NOTION_CLIENT_ID` + `NOTION_CLIENT_SECRET`)
- Google Sheets capture — requires a Google OAuth client (`VITE_GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`)

These are optional. URL capture, upload, iOS Simulator, and all other sources work with no setup.

---

## Building

```bash
npm run build:mac    # macOS DMG + ZIP
npm run build:win    # Windows NSIS installer
```

> Unsigned builds will trigger macOS Gatekeeper warnings. For distribution you'll need an Apple Developer ID certificate.

---

## Project structure

```
electron/          Main process — IPC handlers, Playwright capture, SQLite
  ipc/
    capture.ts     URL, file, and simulator capture
    library.ts     Capture library (SQLite)
    projects.ts    Project storage (SQLite)
    appSettings.ts User settings (data directory)
    export.ts      PNG/WebP export
    sitemap.ts     Sitemap batch capture
    notion.ts      Notion OAuth + capture
    sheets.ts      Google Sheets OAuth + capture
    excel.ts       Excel/CSV capture
    simulator.ts   iOS Simulator integration
    updater.ts     Auto-update
src/               Renderer — React + Tailwind + Konva
  pages/           Full-page views (Home, Editor, Capture, Library, Settings)
  components/      UI components, canvas, sidebar panels, capture forms
  store/           Zustand stores (app state, canvas, projects)
  lib/             Devices, backgrounds, presets, export packs
  types/           Shared TypeScript types
public/assets/     Device SVG mockups, badge images
```

---

## Tech stack

- **Electron 41** + electron-vite
- **React 19** + TypeScript + Tailwind CSS 4
- **Konva.js** (react-konva) — canvas rendering
- **Zustand 5** — state management
- **better-sqlite3** — local storage
- **Playwright** — headless browser capture
- **React Router v6**

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss the approach.

---

## License

MIT
