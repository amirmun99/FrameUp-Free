# Troubleshooting

## Capture Issues

### URL capture times out
- Check your internet connection
- The target site may be slow or blocking automated browsers
- Try increasing the **Delay after load** setting
- Some sites block headless browsers — try capturing with a different URL or use Upload instead

### URL capture shows a blank page
- The site may require JavaScript to render — Frameup waits for the page to load, but some SPAs take longer
- Try adding a **Wait for selector** (e.g., `main`, `.content`, `#app`)
- Increase the **Delay after load** to 2000-5000ms

### Notion capture fails
- Make sure you're connected (click **Connect Notion** if you see the connect screen)
- If your session expired, disconnect and reconnect
- Notion pages with very large databases may take longer to render — the capture waits up to 30 seconds
- Try Desktop viewport if Mobile/Tablet captures look incorrect

### iOS Simulator not showing devices
- Make sure Xcode is installed and at least one simulator is **booted**
- Open Xcode > Window > Devices and Simulators to verify
- This feature is macOS only

## Export Issues

### Export button is greyed out
- Make sure you have a screenshot loaded in the canvas

### Batch export only creates some files
- Check that the output folder has write permissions
- Very large exports may take a few seconds per file

## Performance Issues

### Canvas is slow or laggy
- Large screenshots (>10MB) may impact canvas performance
- Try zooming to a lower level
- Close other resource-intensive applications

### App uses too much memory
- The capture library stores screenshots locally — clear old captures from the Library page
- Restart the app to free up memory from cached browser sessions

## General

### How do I update Frameup?
Go to **Settings** and click **Check for updates**. The app will download and install updates automatically.

### Where is my data stored?
All data is stored locally on your machine — no cloud, no account required.

- **Projects** — `{dataDirectory}/projects.db` (SQLite)
- **Captures** — `{dataDirectory}/captures.db` (SQLite)
- **Notion/Sheets session cookies** — stored locally by Playwright, cleared on disconnect

The default data directory is `~/Library/Application Support/Frameup Free/` on macOS and `%APPDATA%\Frameup Free\` on Windows. You can change it in **Settings > Data Storage**.

### Something looks broken
[Open an issue on GitHub](https://github.com/amirmun99/FrameUp-Free/issues) with a description and steps to reproduce.
