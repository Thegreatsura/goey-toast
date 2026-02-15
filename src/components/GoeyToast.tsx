import { useRef, useState, useEffect, useLayoutEffect, useCallback, type FC, type ReactNode } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { toast as sonnerToast } from 'sonner'
import type { GoeyToastAction, GoeyToastClassNames, GoeyToastPhase, GoeyToastTimings, GoeyToastType } from '../types'
import { getGoeyPosition, getGoeySpring, getGoeyBounce } from '../context'
import { DefaultIcon, SuccessIcon, ErrorIcon, WarningIcon, InfoIcon, SpinnerIcon } from '../icons'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'
import { styles } from './goey-styles'

export interface GoeyToastProps {
  title: string
  description?: ReactNode
  type: GoeyToastType
  action?: GoeyToastAction
  icon?: ReactNode
  phase: GoeyToastPhase
  classNames?: GoeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  timing?: GoeyToastTimings
  spring?: boolean
  bounce?: number
  toastId?: string | number
}

const phaseIconMap: Record<Exclude<GoeyToastPhase, 'loading'>, FC<{ size?: number; className?: string }>> = {
  default: DefaultIcon,
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
}

const titleColorMap: Record<GoeyToastPhase, string> = {
  loading: styles.titleLoading,
  default: styles.titleDefault,
  success: styles.titleSuccess,
  error: styles.titleError,
  warning: styles.titleWarning,
  info: styles.titleInfo,
}

const actionColorMap: Record<GoeyToastPhase, string> = {
  loading: styles.actionInfo,
  default: styles.actionDefault,
  success: styles.actionSuccess,
  error: styles.actionError,
  warning: styles.actionWarning,
  info: styles.actionInfo,
}

const PH = 34 // pill height constant
const DEFAULT_DISPLAY_DURATION = 4000

// Squish spring config — scales mass with morph duration so feel stays consistent
// bounce 0.0 = heavily damped (subtle), 0.8 = very bouncy (dramatic)
const DEFAULT_EXPAND_DUR = 0.6
const DEFAULT_COLLAPSE_DUR = 0.9
function squishSpring(durationSec: number, defaultDur: number, bounce = 0.4) {
  const scale = durationSec / defaultDur
  // Map bounce (0-0.8) to stiffness (200-550) and damping (24-8)
  const stiffness = 200 + bounce * 437.5
  const damping = 24 - bounce * 20
  const mass = 0.7 * scale
  return { type: 'spring' as const, stiffness, damping, mass }
}

/**
 * Singleton MutationObserver registry — one observer per <ol> element shared
 * across all GoeyToast instances mounted under that list. Each toast registers
 * its own callback; the shared observer batches mutations via rAF and invokes
 * every registered callback once per frame.
 */
const observerRegistry = new Map<Element, {
  observer: MutationObserver
  callbacks: Set<() => void>
}>()

function registerSonnerObserver(ol: Element, callback: () => void) {
  let entry = observerRegistry.get(ol)
  if (!entry) {
    const callbacks = new Set<() => void>()
    let applying = false
    const observer = new MutationObserver(() => {
      if (applying) return
      applying = true
      requestAnimationFrame(() => {
        callbacks.forEach(cb => cb())
        requestAnimationFrame(() => { applying = false })
      })
    })
    observer.observe(ol, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: true,
      childList: true,
    })
    entry = { observer, callbacks }
    observerRegistry.set(ol, entry)
  }
  entry.callbacks.add(callback)
  return () => {
    entry!.callbacks.delete(callback)
    if (entry!.callbacks.size === 0) {
      entry!.observer.disconnect()
      observerRegistry.delete(ol)
    }
  }
}

/**
 * Recalculates Sonner's --initial-height and --offset CSS variables on all
 * sibling toast <li> elements so expanded toasts are spaced correctly.
 * Sonner measures height once on mount (getting the compact pill height) and
 * never re-measures for toast.custom() content. This function corrects that.
 */
function syncSonnerHeights(wrapperEl: HTMLElement | null) {
  if (!wrapperEl) return
  const li = wrapperEl.closest('[data-sonner-toast]') as HTMLElement | null
  if (!li?.parentElement) return

  const ol = li.parentElement
  const toasts = Array.from(
    ol.querySelectorAll(':scope > [data-sonner-toast]')
  ) as HTMLElement[]

  // Only update --initial-height so Sonner knows each toast's actual size.
  // Do NOT overwrite --offset — Sonner handles stacking direction (up for
  // bottom positions, down for top) and collapsed peek offsets internally.
  for (const t of toasts) {
    const content = t.firstElementChild as HTMLElement | null
    const height = content ? content.getBoundingClientRect().height : 0
    if (height > 0) {
      t.style.setProperty('--initial-height', `${height}px`)
    }
  }
}

/**
 * Parametric morph path: pill lobe stays constant, body grows from underneath.
 * t=0 → pure pill, t=1 → full organic blob.
 */
function morphPath(pw: number, bw: number, th: number, t: number): string {
  const pr = PH / 2
  const pillW = Math.min(pw, bw)

  const bodyH = PH + (th - PH) * t

  // Pure pill when t is zero or body too small for proper rounded corners
  if (t <= 0 || bodyH - PH < 8) {
    return [
      `M 0,${pr}`,
      `A ${pr},${pr} 0 0 1 ${pr},0`,
      `H ${pillW - pr}`,
      `A ${pr},${pr} 0 0 1 ${pillW},${pr}`,
      `A ${pr},${pr} 0 0 1 ${pillW - pr},${PH}`,
      `H ${pr}`,
      `A ${pr},${pr} 0 0 1 0,${pr}`,
      `Z`,
    ].join(' ')
  }

  const curve = 14 * t
  const cr = Math.min(16, (bodyH - PH) * 0.45)
  const bodyW = pillW + (bw - pillW) * t
  const bodyTop = PH - curve
  const qEndX = Math.min(pillW + curve, bodyW - cr)

  return [
    `M 0,${pr}`,
    `A ${pr},${pr} 0 0 1 ${pr},0`,
    `H ${pillW - pr}`,
    `A ${pr},${pr} 0 0 1 ${pillW},${pr}`,
    `L ${pillW},${bodyTop}`,
    `Q ${pillW},${bodyTop + curve} ${qEndX},${bodyTop + curve}`,
    `H ${bodyW - cr}`,
    `A ${cr},${cr} 0 0 1 ${bodyW},${bodyTop + curve + cr}`,
    `L ${bodyW},${bodyH - cr}`,
    `A ${cr},${cr} 0 0 1 ${bodyW - cr},${bodyH}`,
    `H ${cr}`,
    `A ${cr},${cr} 0 0 1 0,${bodyH - cr}`,
    `Z`,
  ].join(' ')
}

/**
 * Centered morph path: pill centered on top, body grows symmetrically below.
 * t=0 → pure pill (centered), t=1 → full blob with pill centered on top.
 */
function morphPathCenter(pw: number, bw: number, th: number, t: number): string {
  const pr = PH / 2
  const pillW = Math.min(pw, bw)

  // Pill is ALWAYS centered at the final body width position
  const pillOffset = (bw - pillW) / 2

  // Pure pill when t is zero or body too small
  if (t <= 0 || PH + (th - PH) * t - PH < 8) {
    return [
      `M ${pillOffset},${pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset + pr},0`,
      `H ${pillOffset + pillW - pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset + pillW},${pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset + pillW - pr},${PH}`,
      `H ${pillOffset + pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset},${pr}`,
      `Z`,
    ].join(' ')
  }

  const bodyH = PH + (th - PH) * t
  const curve = 14 * t
  const cr = Math.min(16, (bodyH - PH) * 0.45)
  const bodyTop = PH - curve

  // Body grows symmetrically outward from pill center
  const bodyCenter = bw / 2
  const halfBodyW = (pillW / 2) + ((bw - pillW) / 2) * t  // grows from pillW/2 to bw/2
  const bodyLeft = bodyCenter - halfBodyW
  const bodyRight = bodyCenter + halfBodyW

  // Q curve endpoints: body edges meet pill edges with organic curves
  const qLeftX = Math.max(bodyLeft + cr, pillOffset - curve)
  const qRightX = Math.min(bodyRight - cr, pillOffset + pillW + curve)

  return [
    // Start at left side of pill
    `M ${pillOffset},${pr}`,
    // Pill top-left arc
    `A ${pr},${pr} 0 0 1 ${pillOffset + pr},0`,
    // Top edge of pill
    `H ${pillOffset + pillW - pr}`,
    // Pill top-right arc
    `A ${pr},${pr} 0 0 1 ${pillOffset + pillW},${pr}`,
    // Right side down to body junction
    `L ${pillOffset + pillW},${bodyTop}`,
    // Right organic curve from pill to body
    `Q ${pillOffset + pillW},${bodyTop + curve} ${qRightX},${bodyTop + curve}`,
    // Right side of body
    `H ${bodyRight - cr}`,
    // Body top-right corner
    `A ${cr},${cr} 0 0 1 ${bodyRight},${bodyTop + curve + cr}`,
    // Right edge down
    `L ${bodyRight},${bodyH - cr}`,
    // Body bottom-right corner
    `A ${cr},${cr} 0 0 1 ${bodyRight - cr},${bodyH}`,
    // Bottom edge
    `H ${bodyLeft + cr}`,
    // Body bottom-left corner
    `A ${cr},${cr} 0 0 1 ${bodyLeft},${bodyH - cr}`,
    // Left edge up
    `L ${bodyLeft},${bodyTop + curve + cr}`,
    // Body top-left corner
    `A ${cr},${cr} 0 0 1 ${bodyLeft + cr},${bodyTop + curve}`,
    // Left side of body
    `H ${qLeftX}`,
    // Left organic curve from body to pill
    `Q ${pillOffset},${bodyTop + curve} ${pillOffset},${bodyTop}`,
    // Close back to start
    `Z`,
  ].join(' ')
}

// Smooth easing curve for non-spring animations
const SMOOTH_EASE = [0.4, 0, 0.2, 1] as const

export const GoeyToast: FC<GoeyToastProps> = ({
  title,
  description,
  action,
  icon,
  phase,
  classNames,
  fillColor = '#ffffff',
  borderColor,
  borderWidth,
  timing,
  spring: springProp,
  bounce: bounceProp,
  toastId,
}) => {
  const position = getGoeyPosition()
  const isRight = position?.includes('right') ?? false
  const isCenter = position?.includes('center') ?? false
  const prefersReducedMotion = usePrefersReducedMotion()
  // Per-toast spring overrides global, default to true
  const useSpring = springProp ?? getGoeySpring()
  const bounceVal = bounceProp ?? getGoeyBounce() ?? 0.4

  // Action success override state
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [dismissing, setDismissing] = useState(false)
  const [hovered, setHovered] = useState(false)
  const hoveredRef = useRef(false)
  const collapsingRef = useRef(false)
  const preDismissRef = useRef(false)
  const collapseEndTime = useRef(0)
  const expandedDimsRef = useRef({ pw: 0, bw: 0, th: 0 })
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Effective values (overridden when action success is active)
  const effectiveTitle = actionSuccess ?? title
  const effectivePhase: GoeyToastPhase = actionSuccess ? 'success' : phase
  const effectiveDescription = actionSuccess ? undefined : description
  const effectiveAction = actionSuccess ? undefined : action

  const isLoading = effectivePhase === 'loading'
  const hasDescription = Boolean(effectiveDescription)
  const hasAction = Boolean(effectiveAction)
  const isExpanded = (hasDescription || hasAction) && !dismissing

  const [showBody, setShowBody] = useState(false)

  // DOM refs
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Animation controllers
  const morphCtrl = useRef<ReturnType<typeof animate> | null>(null)
  const pillResizeCtrl = useRef<ReturnType<typeof animate> | null>(null)
  const headerSquishCtrl = useRef<ReturnType<typeof animate> | null>(null)

  // Animated state (not React state — avoids re-renders during animation)
  const morphTRef = useRef(0)
  const aDims = useRef({ pw: 0, bw: 0, th: 0 }) // animated dims
  const dimsRef = useRef({ pw: 0, bw: 0, th: 0 }) // latest measured dims

  // React state for dims (triggers effects)
  const [dims, setDims] = useState({ pw: 0, bw: 0, th: 0 })
  useEffect(() => { dimsRef.current = dims }, [dims])

  // Push current animated state to SVG DOM + constrain wrapper/content
  // NOTE: We intentionally do NOT set style.height on the wrapper.
  // The content's maxHeight constrains the rendered height, and letting
  // the wrapper derive its height naturally allows Sonner to accurately
  // measure the toast height for stacking/positioning.
  const flush = useCallback(() => {
    const { pw: p, bw: b, th: h } = aDims.current
    if (p <= 0 || b <= 0 || h <= 0) return
    // Clamp t to [0,1] — spring overshoot past 1 or below 0 must not
    // cause flush to toggle between constraint branches (jitter).
    const t = Math.max(0, Math.min(1, morphTRef.current))
    // Read position fresh each call so flush never uses a stale value
    const pos = getGoeyPosition()
    const rightSide = pos?.includes('right') ?? false
    const centerPos = pos?.includes('center') ?? false
    // Center positions: use full target body width during morph so pill stays fixed at center
    // At t=0 (compact), wrapper is pill-width so use regular morphPath (no centering needed)
    if (centerPos && t > 0) {
      const centerBw = dimsRef.current.bw > 0 ? Math.max(dimsRef.current.bw, p) : b
      pathRef.current?.setAttribute('d', morphPathCenter(p, centerBw, h, t))
    } else {
      pathRef.current?.setAttribute('d', morphPath(p, b, h, t))
    }

    if (t >= 1) {
      // Fully expanded: clear all constraints
      if (wrapperRef.current) {
        wrapperRef.current.style.width = ''
      }
      if (contentRef.current) {
        contentRef.current.style.width = ''
        contentRef.current.style.overflow = ''
        contentRef.current.style.maxHeight = ''
        contentRef.current.style.clipPath = ''
      }
    } else if (t > 0) {
      // Morphing: lock content at final target width + clip-path (prevents text reflow)
      const targetBw = dimsRef.current.bw
      const targetTh = dimsRef.current.th
      const pillW = Math.min(p, b)
      const currentW = pillW + (b - pillW) * t
      const currentH = PH + (targetTh - PH) * t
      if (wrapperRef.current) {
        // Center: full target body width so SVG morph path has room
        const targetFullW = dimsRef.current.bw > 0 ? dimsRef.current.bw : b
        wrapperRef.current.style.width = (centerPos ? targetFullW : currentW) + 'px'
      }
      if (contentRef.current) {
        contentRef.current.style.width = targetBw + 'px'
        contentRef.current.style.overflow = 'hidden'
        contentRef.current.style.maxHeight = currentH + 'px'
        const clip = targetBw - currentW
        if (centerPos) {
          const halfClip = clip / 2
          contentRef.current.style.clipPath = `inset(0 ${halfClip}px 0 ${halfClip}px)`
        } else {
          contentRef.current.style.clipPath = rightSide
            ? `inset(0 0 0 ${clip}px)`
            : `inset(0 ${clip}px 0 0)`
        }
      }
    } else {
      // Compact: constrain to pill dimensions
      const pillW = Math.min(p, b)
      if (wrapperRef.current) {
        wrapperRef.current.style.width = pillW + 'px'
      }
      if (contentRef.current) {
        contentRef.current.style.width = ''
        contentRef.current.style.overflow = 'hidden'
        contentRef.current.style.maxHeight = PH + 'px'
        contentRef.current.style.clipPath = ''
      }
    }
  }, [])

  // Measure content dimensions (clear all constraints first for accurate reading)
  const measure = useCallback(() => {
    if (!headerRef.current || !contentRef.current) return
    const wr = wrapperRef.current
    const savedW = wr?.style.width ?? ''
    const savedOv = contentRef.current.style.overflow
    const savedMH = contentRef.current.style.maxHeight
    const savedCW = contentRef.current.style.width
    if (wr) { wr.style.width = '' }
    contentRef.current.style.overflow = ''
    contentRef.current.style.maxHeight = ''
    contentRef.current.style.width = ''

    const cs = getComputedStyle(contentRef.current)
    const paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
    const pw = headerRef.current.offsetWidth + paddingX
    const bw = contentRef.current.offsetWidth
    const th = contentRef.current.offsetHeight

    if (wr) { wr.style.width = savedW }
    contentRef.current.style.overflow = savedOv
    contentRef.current.style.maxHeight = savedMH
    contentRef.current.style.width = savedCW

    setDims({ pw, bw, th })
  }, [])

  // Measure on prop changes (useLayoutEffect prevents flash of unconstrained content)
  useLayoutEffect(() => {
    measure()
    const t = setTimeout(measure, 100)
    return () => clearTimeout(t)
  }, [effectiveTitle, effectivePhase, isExpanded, showBody, effectiveDescription, effectiveAction, measure])

  useEffect(() => {
    if (!contentRef.current) return
    const ro = new ResizeObserver(measure)
    ro.observe(contentRef.current)
    return () => ro.disconnect()
  }, [measure])

  const { pw, bw, th } = dims
  const hasDims = pw > 0 && bw > 0 && th > 0

  // Squish animation controller (shared between landing + blob squish)
  const blobSquishCtrl = useRef<ReturnType<typeof animate> | null>(null)

  // Landing squish: single smooth boing — spring scales with user timing
  const expandDur = timing?.expandDuration ?? DEFAULT_EXPAND_DUR
  const collapseDur = timing?.collapseDuration ?? DEFAULT_COLLAPSE_DUR
  const lastSquishTime = useRef(0)
  const triggerLandingSquish = useCallback((phase: 'expand' | 'collapse' | 'mount' = 'mount') => {
    if (!wrapperRef.current || prefersReducedMotion) return
    // Skip squish entirely when spring is disabled
    if (!useSpring) return
    const now = Date.now()
    if (now - lastSquishTime.current < 300) return
    lastSquishTime.current = now
    blobSquishCtrl.current?.stop()
    const el = wrapperRef.current
    const springConfig = phase === 'collapse'
      ? squishSpring(collapseDur, DEFAULT_COLLAPSE_DUR, bounceVal)
      : squishSpring(expandDur, DEFAULT_EXPAND_DUR, bounceVal)
    // Softer squish on collapse — blob is wider so same % looks more drastic
    // Scale squish intensity with bounce (0.05=subtle, 0.8=dramatic)
    const bScale = bounceVal / 0.4
    const compressY = (phase === 'collapse' ? 0.07 : 0.12) * bScale
    const expandX = (phase === 'collapse' ? 0.035 : 0.06) * bScale
    blobSquishCtrl.current = animate(0, 1, {
      ...springConfig,
      onUpdate: (v) => {
        const intensity = Math.sin(v * Math.PI)
        const sy = 1 - compressY * intensity
        const sx = 1 + expandX * intensity
        const mirror = el.style.transform?.includes('scaleX(-1)') ? 'scaleX(-1) ' : ''
        // Anchor squish at pill (top of blob) so body feels like it expands from pill center
        el.style.transformOrigin = 'center top'
        el.style.transform = mirror + `scaleX(${sx}) scaleY(${sy})`
      },
      onComplete: () => {
        const right = el.style.transform?.includes('scaleX(-1)')
        el.style.transform = right ? 'scaleX(-1)' : ''
        el.style.transformOrigin = ''
      },
    })
  }, [prefersReducedMotion, expandDur, collapseDur, useSpring, bounceVal])

  // Handle dims changes: pill resize animation (compact) or direct update (expanded)
  useLayoutEffect(() => {
    if (!hasDims || collapsingRef.current) return

    const prev = { ...aDims.current }
    const target = { pw, bw, th }

    // First render — set immediately
    if (prev.bw <= 0) {
      aDims.current = target
      flush()
      return
    }

    // During morph animation — just update target dims, morph callback reads them
    if (morphTRef.current > 0 && morphTRef.current < 1) {
      aDims.current = target
      flush()
      return
    }

    // Expanded and settled (morph done) — update immediately
    if (showBody) {
      aDims.current = target
      flush()
      return
    }

    // Compact mode: animate pill resize smoothly
    if (prev.bw === target.bw && prev.pw === target.pw && prev.th === target.th) return

    if (prefersReducedMotion) {
      aDims.current = target
      flush()
      return
    }

    pillResizeCtrl.current?.stop()
    // Fire vertical squish alongside the horizontal resize
    // Skip if recently collapsed or about to expand (promise resolve/reject)
    if (Date.now() - collapseEndTime.current > 500 && !isExpanded) {
      triggerLandingSquish('expand')
    }
    const pillResizeTransition = useSpring
      ? { type: 'spring' as const, duration: 0.5, bounce: bounceVal * 0.875 }
      : { duration: 0.4, ease: SMOOTH_EASE }
    pillResizeCtrl.current = animate(0, 1, {
      ...pillResizeTransition,
      onUpdate: (t) => {
        aDims.current = {
          pw: prev.pw + (target.pw - prev.pw) * t,
          bw: prev.bw + (target.bw - prev.bw) * t,
          th: prev.th + (target.th - prev.th) * t,
        }
        flush()
      },
    })
  }, [pw, bw, th, hasDims, showBody, flush, prefersReducedMotion, triggerLandingSquish, useSpring])

  // Squish on entry: only for simple toasts (no body text) — expanded toasts get squish from showBody
  const squishDelayMs = timing?.squishDelay ?? 45
  const expandDelayMs = prefersReducedMotion ? 0 : (timing?.expandDelay ?? 330)
  const mountSquished = useRef(false)
  useEffect(() => {
    if (hasDims && !mountSquished.current && !isExpanded) {
      mountSquished.current = true
      const t = setTimeout(triggerLandingSquish, squishDelayMs)
      return () => clearTimeout(t)
    }
  }, [hasDims, squishDelayMs, triggerLandingSquish])

  // Squish on expand (showBody false→true) — collapse squish is fired directly in morph code
  const prevShowBody = useRef(false)
  useLayoutEffect(() => {
    if (!prevShowBody.current && showBody) {
      // Small delay after morph starts for more satisfying "settle then bounce" feel
      const t = setTimeout(() => triggerLandingSquish('expand'), 80)
      return () => clearTimeout(t)
    }
    prevShowBody.current = showBody
  }, [showBody, triggerLandingSquish])

  // Error shake: quick horizontal shake when phase transitions to error (not during dismiss)
  const shakeCtrl = useRef<ReturnType<typeof animate> | null>(null)
  const prevPhase = useRef(phase)
  useEffect(() => {
    if (phase === 'error' && prevPhase.current !== 'error' && !dismissing && wrapperRef.current && !prefersReducedMotion) {
      shakeCtrl.current?.stop()
      const el = wrapperRef.current
      const mirror = el.style.transform?.includes('scaleX(-1)') ? 'scaleX(-1) ' : ''
      shakeCtrl.current = animate(0, 1, {
        duration: 0.4,
        ease: 'easeOut',
        onUpdate: (v) => {
          const decay = 1 - v
          const shake = Math.sin(v * Math.PI * 6) * decay * 3
          el.style.transform = mirror + `translateX(${shake}px)`
        },
        onComplete: () => {
          el.style.transform = mirror.trim() || ''
        },
      })
    }
    prevPhase.current = phase
    return () => { shakeCtrl.current?.stop() }
  }, [phase, dismissing, prefersReducedMotion])

  // Phase 1: expand (delay showBody) or collapse (reverse morph)
  useEffect(() => {
    if (isExpanded) {
      const delay = prefersReducedMotion ? 0 : (timing?.expandDelay ?? 330)
      const t1 = setTimeout(() => setShowBody(true), delay)
      return () => clearTimeout(t1)
    }

    morphCtrl.current?.stop()
    pillResizeCtrl.current?.stop()

    // Reverse morph if currently expanded
    if (morphTRef.current > 0) {
      // Compute target compact pill dims from current header content
      const csPad = contentRef.current ? getComputedStyle(contentRef.current) : null
      const padX = csPad ? parseFloat(csPad.paddingLeft) + parseFloat(csPad.paddingRight) : 20
      const targetPw = headerRef.current ? headerRef.current.offsetWidth + padX : aDims.current.pw
      const targetDims = { pw: targetPw, bw: targetPw, th: PH }

      if (prefersReducedMotion) {
        morphTRef.current = 0
        collapsingRef.current = false
        preDismissRef.current = false
        setShowBody(false)
        aDims.current = { ...targetDims }
        flush()
        return
      }

      const savedDims = expandedDimsRef.current.bw > 0
        ? { ...expandedDimsRef.current }
        : { ...aDims.current }

      const isPreDismiss = preDismissRef.current
      const collapseDur = timing?.collapseDuration ?? 0.9
      // Use easing when spring is disabled or during pre-dismiss
      const collapseTransition = (isPreDismiss || !useSpring)
        ? { duration: collapseDur, ease: SMOOTH_EASE }
        : { type: 'spring' as const, duration: collapseDur, bounce: bounceVal * 0.875 }

      // Fire squish immediately as collapse begins — don't wait for morph to finish
      triggerLandingSquish('collapse')

      morphCtrl.current = animate(morphTRef.current, 0, {
        ...collapseTransition,
        onUpdate: (t) => {
          morphTRef.current = t
          aDims.current = {
            pw: targetDims.pw + (savedDims.pw - targetDims.pw) * t,
            bw: targetDims.bw + (savedDims.bw - targetDims.bw) * t,
            th: targetDims.th + (savedDims.th - targetDims.th) * t,
          }
          flush()
        },
        onComplete: () => {
          morphTRef.current = 0
          collapsingRef.current = false
          preDismissRef.current = false
          collapseEndTime.current = Date.now()
          aDims.current = { ...targetDims }
          flush()
          setShowBody(false)
        },
      })
      return () => { morphCtrl.current?.stop() }
    }

    setShowBody(false)
    morphTRef.current = 0
    flush()
  }, [isExpanded, flush, prefersReducedMotion, useSpring, timing?.collapseDuration, triggerLandingSquish])

  // Pre-dismiss collapse: shrink back to pill before Sonner removes the toast
  // Hover pauses the timer. On unhover, timer restarts with remaining time.
  const remainingRef = useRef<number | null>(null)
  const timerStartRef = useRef(0)
  useEffect(() => {
    if (!showBody || actionSuccess || dismissing) return

    const expandDelayMs = prefersReducedMotion ? 0 : (timing?.expandDelay ?? 330)
    const collapseMs = prefersReducedMotion ? 10 : ((timing?.collapseDuration ?? 0.9) * 1000)
    const displayMs = timing?.displayDuration ?? DEFAULT_DISPLAY_DURATION
    const fullDelay = displayMs - expandDelayMs - collapseMs
    if (fullDelay <= 0) return

    // Don't start while hovered

    const delay = remainingRef.current ?? fullDelay
    timerStartRef.current = Date.now()

    const timer = setTimeout(() => {
      remainingRef.current = null
      expandedDimsRef.current = { ...aDims.current }
      collapsingRef.current = true
      preDismissRef.current = true
      setDismissing(true)
    }, delay)
    dismissTimerRef.current = timer

    return () => {
      clearTimeout(timer)
      // Save remaining time when cleaning up (e.g. hover started)
      const elapsed = Date.now() - timerStartRef.current
      const remaining = delay - elapsed
      if (remaining > 0 && hoveredRef.current) {
        remainingRef.current = remaining
      }
    }
  }, [showBody, actionSuccess, dismissing, prefersReducedMotion, hovered])

  // Re-expand on hover: if collapsed/collapsing and user hovers, reverse it
  const canExpand = hasDescription || hasAction
  useEffect(() => {
    if (!hovered || !canExpand || !dismissing) return
    // Stop collapse morph, reset state, re-expand
    morphCtrl.current?.stop()
    collapsingRef.current = false
    preDismissRef.current = false
    remainingRef.current = null // fresh timer on next cycle
    setDismissing(false)
    // Set showBody immediately so the expand morph starts without Phase 1 delay
    setShowBody(true)
  }, [hovered, dismissing, canExpand])

  // Dismiss from Sonner after collapse completes and user is not hovering
  useEffect(() => {
    if (!toastId || !dismissing || showBody || hovered) return
    const t = setTimeout(() => {
      if (!hoveredRef.current) sonnerToast.dismiss(toastId)
    }, 800)
    return () => clearTimeout(t)
  }, [dismissing, showBody, hovered, toastId])

  // Phase 2: morph from pill → blob
  useEffect(() => {
    if (!showBody) {
      morphTRef.current = 0
      morphCtrl.current?.stop()
      flush()
      return
    }

    if (prefersReducedMotion) {
      pillResizeCtrl.current?.stop()
      morphCtrl.current?.stop()
      morphTRef.current = 1
      aDims.current = { ...dimsRef.current }
      flush()
      syncSonnerHeights(wrapperRef.current)
      return
    }

    const raf = requestAnimationFrame(() => {
      pillResizeCtrl.current?.stop()
      morphCtrl.current?.stop()
      // Capture current animated dims so we interpolate smoothly from
      // wherever the pill resize left off instead of snapping to target.
      const startDims = { ...aDims.current }
      const morphExpandTransition = useSpring
        ? { type: 'spring' as const, duration: timing?.expandDuration ?? 0.9, bounce: bounceVal }
        : { duration: timing?.expandDuration ?? 0.6, ease: SMOOTH_EASE }
      morphCtrl.current = animate(0, 1, {
        ...morphExpandTransition,
        onUpdate: (t) => {
          morphTRef.current = t
          const target = dimsRef.current
          aDims.current = {
            pw: startDims.pw + (target.pw - startDims.pw) * t,
            bw: startDims.bw + (target.bw - startDims.bw) * t,
            th: startDims.th + (target.th - startDims.th) * t,
          }
          flush()
        },
        onComplete: () => {
          morphTRef.current = 1
          aDims.current = { ...dimsRef.current }
          flush()
          syncSonnerHeights(wrapperRef.current)
        },
      })
    })

    return () => {
      cancelAnimationFrame(raf)
      morphCtrl.current?.stop()
    }
  }, [showBody, flush, prefersReducedMotion, useSpring, timing?.expandDuration])

  // Header elastic squish: spring down when expanding, spring back once on collapse/dismiss
  const headerSquished = useRef(false)
  useEffect(() => {
    if (!headerRef.current || prefersReducedMotion) return
    headerSquishCtrl.current?.stop()
    const el = headerRef.current

    if (showBody && !dismissing && !actionSuccess) {
      // Skip header squish when spring is disabled
      if (!useSpring) return
      // Squish down with elastic spring — scaled to expand timing
      headerSquished.current = true
      headerSquishCtrl.current = animate(0, 1, {
        ...squishSpring(expandDur, DEFAULT_EXPAND_DUR, bounceVal),
        onUpdate: (v) => {
          const scale = 1 - 0.05 * v
          const pushY = v * 1
          el.style.transform = `scale(${scale}) translateY(${pushY}px)`
        },
      })
    } else if (headerSquished.current) {
      // Spring back to normal — match morph transition type
      headerSquished.current = false
      // Use easing when spring is disabled or during pre-dismiss
      const isSpringCollapse = !preDismissRef.current && useSpring
      const transition = isSpringCollapse
        ? squishSpring(collapseDur, DEFAULT_COLLAPSE_DUR, bounceVal)
        : { duration: collapseDur * 0.5, ease: SMOOTH_EASE }
      headerSquishCtrl.current = animate(1, 0, {
        ...transition,
        onUpdate: (v) => {
          const scale = 1 - 0.05 * v
          const pushY = v * 1
          el.style.transform = `scale(${scale}) translateY(${pushY}px)`
        },
        onComplete: () => {
          el.style.transform = ''
        },
      })
    }

    return () => { headerSquishCtrl.current?.stop() }
  }, [showBody, dismissing, actionSuccess, prefersReducedMotion, expandDur, collapseDur, useSpring])

  // Keep Sonner's toast stacking in sync when it re-renders (e.g. hover expand/collapse).
  // Sonner overwrites --offset/--initial-height with stale values from its React state,
  // so we observe style mutations on the toast list and re-apply correct heights.
  // Uses a shared singleton observer per <ol> to avoid N observers for N toasts.
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const ol = wrapper.closest('[data-sonner-toast]')?.parentElement
    if (!ol) return

    return registerSonnerObserver(ol, () => {
      syncSonnerHeights(wrapper)
    })
  }, [])

  // Action button handler
  const handleActionClick = useCallback(() => {
    if (!effectiveAction) return
    effectiveAction.onClick()
    if (effectiveAction.successLabel) {
      // Save expanded dims synchronously before React re-renders
      expandedDimsRef.current = { ...aDims.current }
      collapsingRef.current = true
      setActionSuccess(effectiveAction.successLabel)
    }
  }, [effectiveAction])

  const renderIcon = () => {
    if (!actionSuccess && icon) return icon
    if (isLoading) return <SpinnerIcon size={18} className={styles.spinnerSpin} />
    const IconComponent = phaseIconMap[effectivePhase]
    return <IconComponent size={18} />
  }

  const iconTransition = prefersReducedMotion ? { duration: 0.01 } : { duration: 0.2 }
  const iconEl = (
    <div className={`${styles.iconWrapper}${classNames?.icon ? ` ${classNames.icon}` : ''}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={isLoading ? 'spinner' : effectivePhase}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={iconTransition}
        >
          {renderIcon()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
  const titleEl = (
    <span className={`${styles.title}${classNames?.title ? ` ${classNames.title}` : ''}`}>{effectiveTitle}</span>
  )

  const iconAndTitle = (
    <>{iconEl}{titleEl}</>
  )

  return (
    <div ref={wrapperRef} className={`${styles.wrapper}${classNames?.wrapper ? ` ${classNames.wrapper}` : ''}`} style={isCenter ? { margin: '0 auto' } : isRight ? { marginLeft: 'auto', transform: 'scaleX(-1)' } : undefined} role={effectivePhase === 'error' ? 'alert' : 'status'} aria-live={effectivePhase === 'error' ? 'assertive' : 'polite'} aria-atomic="true" onMouseEnter={() => { hoveredRef.current = true; setHovered(true) }} onMouseLeave={() => { hoveredRef.current = false; setHovered(false) }} data-center={isCenter || undefined}>
      {/* SVG background — overflow visible, path controls shape */}
      <svg
        className={styles.blobSvg}
        aria-hidden
      >
        <path
          ref={pathRef}
          fill={fillColor}
          stroke={borderColor || 'none'}
          strokeWidth={borderColor ? (borderWidth ?? 1.5) : 0}
        />
      </svg>

      {/* Content — un-flip so text reads normally */}
      <div
        ref={contentRef}
        className={`${styles.content} ${showBody ? styles.contentExpanded : styles.contentCompact}${classNames?.content ? ` ${classNames.content}` : ''}`}
        style={isCenter ? { textAlign: 'center' } : isRight ? { transform: 'scaleX(-1)', textAlign: 'right' } : { textAlign: 'left' }}
      >
        <div ref={headerRef} className={`${styles.header} ${titleColorMap[effectivePhase]}${classNames?.header ? ` ${classNames.header}` : ''}`}>
          {iconAndTitle}
        </div>

        <AnimatePresence>
          {showBody && hasDescription && !dismissing && (
            <motion.div
              key="description"
              className={`${styles.description}${classNames?.description ? ` ${classNames.description}` : ''}`}
              style={{ textAlign: 'left' }}
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              {effectiveDescription}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBody && hasAction && effectiveAction && !dismissing && (
            <motion.div
              key="action"
              className={`${styles.actionWrapper}${classNames?.actionWrapper ? ` ${classNames.actionWrapper}` : ''}`}
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.35, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
            >
              <button
                className={`${styles.actionButton} ${actionColorMap[effectivePhase]}${classNames?.actionButton ? ` ${classNames.actionButton}` : ''}`}
                onClick={handleActionClick}
                type="button"
                aria-label={effectiveAction.label}
              >
                {effectiveAction.label}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
