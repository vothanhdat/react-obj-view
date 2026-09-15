import { useEffect, useState } from 'react'

/**
 * Live frames-per-second meter. Samples rAF deltas and reports a smoothed
 * value roughly twice a second. Used to prove the viewer stays at 60fps
 * even while scrolling millions of nodes.
 */
export const useFps = (enabled = true) => {
  const [fps, setFps] = useState(60)

  useEffect(() => {
    if (!enabled) return
    let raf = 0
    let frames = 0
    let last = performance.now()

    const tick = (now: number) => {
      frames++
      const elapsed = now - last
      if (elapsed >= 500) {
        setFps(Math.round((frames * 1000) / elapsed))
        frames = 0
        last = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [enabled])

  return fps
}
