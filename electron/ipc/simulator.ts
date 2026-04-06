import { ipcMain } from 'electron'
import { execFile } from 'child_process'
import { readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

interface SimulatorDevice {
  udid: string
  name: string
  state: string
  deviceTypeIdentifier: string
  runtime: string
}

interface SimctlDevices {
  devices: Record<string, Array<{
    udid: string
    name: string
    state: string
    deviceTypeIdentifier: string
    isAvailable: boolean
  }>>
}

export function registerSimulatorHandlers(): void {
  // List booted iOS simulators
  ipcMain.handle('capture:simulator:list', async () => {
    try {
      if (process.platform !== 'darwin') {
        return { success: false, error: 'iOS Simulator is only available on macOS' }
      }

      const { stdout } = await execFileAsync('xcrun', ['simctl', 'list', 'devices', '--json'])
      const parsed: SimctlDevices = JSON.parse(stdout)

      const bootedDevices: SimulatorDevice[] = []
      for (const [runtime, deviceList] of Object.entries(parsed.devices)) {
        for (const device of deviceList) {
          if (device.state === 'Booted' && device.isAvailable) {
            // Extract readable runtime name (e.g. "iOS 18.0" from "com.apple.CoreSimulator.SimRuntime.iOS-18-0")
            const runtimeName = runtime
              .replace('com.apple.CoreSimulator.SimRuntime.', '')
              .replace(/-/g, '.')
              .replace(/\.(\d+)$/, ' $1')

            bootedDevices.push({
              udid: device.udid,
              name: device.name,
              state: device.state,
              deviceTypeIdentifier: device.deviceTypeIdentifier,
              runtime: runtimeName
            })
          }
        }
      }

      return { success: true, data: bootedDevices }
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('xcrun') || msg.includes('ENOENT')) {
        return { success: false, error: 'Xcode command-line tools not found. Install Xcode to use Simulator capture.' }
      }
      return { success: false, error: msg }
    }
  })

  // Capture screenshot from a booted simulator
  ipcMain.handle('capture:simulator:capture', async (_, deviceUDID: string) => {
    try {
      if (process.platform !== 'darwin') {
        return { success: false, error: 'iOS Simulator is only available on macOS' }
      }

      // Validate UDID format to prevent argument injection
      if (!/^[0-9A-F]{8}-([0-9A-F]{4}-){3}[0-9A-F]{12}$/i.test(deviceUDID)) {
        return { success: false, error: 'Invalid device UDID format' }
      }

      const tempPath = join(tmpdir(), `frameup-sim-${Date.now()}.png`)

      await execFileAsync('xcrun', [
        'simctl', 'io', deviceUDID, 'screenshot', '--type', 'png', tempPath
      ])

      const buffer = await readFile(tempPath)
      // Clean up temp file
      await unlink(tempPath).catch(() => {})

      return { success: true, data: buffer.toString('base64') }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })
}
