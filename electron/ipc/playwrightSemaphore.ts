// Limits concurrent Playwright browser launches to 1 to prevent
// resource exhaustion from simultaneous capture requests.
let busy = false
const queue: Array<() => void> = []

export async function acquirePlaywright(): Promise<() => void> {
  if (!busy) {
    busy = true
    return release
  }
  await new Promise<void>((resolve) => queue.push(resolve))
  return release
}

function release(): void {
  if (queue.length > 0) {
    const next = queue.shift()!
    next()
  } else {
    busy = false
  }
}
