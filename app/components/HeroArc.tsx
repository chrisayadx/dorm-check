'use client'

import { useEffect, useRef } from 'react'
import { UniLogo } from './UniLogo'
import { initialsOf } from './ui'

/**
 * HeroArc — university marks travelling a fixed path over the headline.
 *
 * The path is three joined segments: a flat entry line off the left edge,
 * a raised arc across the headline, and a flat exit line off the right edge.
 * The arc's endpoints sit exactly on the flat lines' y value, so the joins
 * are continuous and the marks never dip down into the text.
 *
 * Positions are written straight to the DOM in a rAF loop rather than held
 * in state — six marks re-rendering at 60fps would thrash React for nothing.
 */

const PERIOD = 26000      // ms for one mark to traverse the whole path
const ENTER = 0.16        // fraction of the path spent on the left flat line
const EXIT = 0.84         // path fraction where the right flat line begins
const FLAT_Y = 172         // y of the flat lines, relative to headline top
const APEX = 150          // how far above FLAT_Y the arc peaks
const OVERSHOOT = 220     // px past the arc ends, so marks clear the frame
const FADE = 0.06         // fraction of path used to fade in and out

const FEATURE_INTERVAL = 10000
const FEATURE_LIFT = 40   // extra px above the path for the featured mark
const FEATURE_SCALE = 0.42 // added to scale 1 when fully featured

export function HeroArc({
  universities,
  onFeature,
}: {
  universities: string[]
  onFeature?: (university: string) => void
}) {
  const nodes = useRef<(HTMLDivElement | null)[]>([])
  const progress = useRef<number[]>([])
  const featureAmt = useRef<number[]>([])
  const featured = useRef<number | null>(null)
  const widthRef = useRef(320)

  const list = universities.slice(0, 6)
  const n = list.length

  // Responsive half-width of the arc
  useEffect(() => {
    const calc = () => {
      widthRef.current = Math.max(180, Math.min(340, window.innerWidth * 0.32))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  // Pick a new featured mark every 10s — whichever is nearest the apex
  useEffect(() => {
    if (n === 0) return

    const pick = () => {
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < n; i += 1) {
        const t = progress.current[i] ?? 0
        const d = Math.abs(t - 0.5)
        if (d < bestDist) { bestDist = d; best = i }
      }
      featured.current = best
      onFeature?.(list[best])
    }

    const first = setTimeout(pick, 1200)
    const loop = setInterval(pick, FEATURE_INTERVAL)
    return () => { clearTimeout(first); clearInterval(loop) }
  }, [n, list, onFeature])

  // The animation loop
  useEffect(() => {
    if (n === 0) return

    progress.current = Array.from({ length: n }, (_, i) => i / n)
    featureAmt.current = Array.from({ length: n }, () => 0)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last = performance.now()

    // Map a path fraction to an (x, y) point.
    function pathPoint(t: number, W: number) {
      if (t < ENTER) {
        // flat line entering from off the left
        const k = t / ENTER
        const xStart = -(W + OVERSHOOT)
        return { x: xStart + (-W - xStart) * k, y: FLAT_Y }
      }
      if (t > EXIT) {
        // flat line exiting off the right
        const k = (t - EXIT) / (1 - EXIT)
        const xEnd = W + OVERSHOOT
        return { x: W + (xEnd - W) * k, y: FLAT_Y }
      }
           // Downward-opening parabola. 4k(1-k) is zero at both ends and 1 at the
      // centre, so the vertex sits APEX above the flat lines and the joins
      // land exactly on FLAT_Y with no kink. x is linear across the span,
      // which keeps horizontal speed constant — a cosine x makes the marks
      // crawl at the edges and sprint through the middle.
      const k = (t - ENTER) / (EXIT - ENTER)
      return {
        x: -W + 2 * W * k,
        y: FLAT_Y - APEX * (4 * k * (1 - k)),
      }
    }

    function paint(now: number) {
      const dt = Math.min(now - last, 48) // clamp so a backgrounded tab doesn't jump
      last = now
      const W = widthRef.current

      for (let i = 0; i < n; i += 1) {
        if (!reduced) {
          progress.current[i] = (progress.current[i] + dt / PERIOD) % 1
        }
        const t = progress.current[i]

        // ease the feature highlight in and out instead of snapping
        const target = featured.current === i ? 1 : 0
        const cur = featureAmt.current[i]
        featureAmt.current[i] = cur + (target - cur) * Math.min(1, dt / 260)
        const f = featureAmt.current[i]

        const { x, y } = pathPoint(t, W)
        const fade = Math.max(0, Math.min(1, Math.min(t / FADE, (1 - t) / FADE)))
        const scale = 1 + FEATURE_SCALE * f
        const lift = FEATURE_LIFT * f

        const el = nodes.current[i]
        if (!el) continue
        el.style.transform =
          `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${(y - lift).toFixed(1)}px)) scale(${scale.toFixed(3)})`
        el.style.opacity = String(fade * (0.72 + 0.28 * f))
        el.style.zIndex = f > 0.5 ? '6' : '1'

        const ring = el.firstElementChild?.querySelector('.arc-focus-ring') as HTMLElement | null
        if (ring) ring.style.opacity = String(f)
      }

      raf = requestAnimationFrame(paint)
    }

    raf = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(raf)
  }, [n])

  if (n === 0) return null

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {list.map((u, i) => (
        <div
          key={u}
          ref={(el) => { nodes.current[i] = el }}
          title={u}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 54,
            height: 54,
            opacity: 0,
            willChange: 'transform, opacity',
          }}
        >
          <span style={{ display: 'block', position: 'relative' }}>
            <span
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 6px 18px rgba(17, 41, 92, 0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--blue-900)',
              }}
            >
              <UniLogo code={initialsOf(u)} />
            </span>
            <span className="arc-focus-ring" style={{ opacity: 0 }} />
          </span>
        </div>
      ))}
    </div>
  )
}