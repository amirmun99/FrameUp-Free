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
- Free users: check if you've hit the 10 exports/month limit

### Batch export only creates some files
- Check that the output folder has write permissions
- Very large exports may take a few seconds per file

## Authentication Issues

### Can't sign in
- Check your internet connection
- Try a different auth method (Google, GitHub, or magic link)
- Clear the app data and try again

### Notion won't connect
- Make sure the Notion integration is properly configured
- When the browser window opens, log in and click **Allow** to grant access
- If the browser doesn't close automatically, close it manually — your connection may still have succeeded

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
- **Projects** are stored in the cloud (Supabase) and require sign-in
- **Captures** are cached locally in a SQLite database in your app data folder
- **Notion/Sheets session cookies** are stored locally and cleared on disconnect
