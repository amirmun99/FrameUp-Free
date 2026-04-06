import { useState, useEffect } from 'react'

export function useImageLoader(src: string | null): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!src) {
      setImage(null)
      return
    }

    const img = document.createElement('img')
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }

    function onload() {
      if (!cancelled) setImage(img)
    }
    function onerror() {
      if (!cancelled) setImage(null)
    }

    img.addEventListener('load', onload)
    img.addEventListener('error', onerror)
    img.src = src

    // For data URLs and cached images, the browser may have
    // already loaded the image synchronously by this point
    if (img.complete) {
      onload()
    }

    return () => {
      cancelled = true
      img.removeEventListener('load', onload)
      img.removeEventListener('error', onerror)
    }
  }, [src])

  return image
}
