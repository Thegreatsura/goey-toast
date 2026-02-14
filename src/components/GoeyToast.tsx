import { useRef, useState, useEffect, useLayoutEffect, useCallback, type FC, type ReactNode } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import type { GoeyToastAction, GoeyToastClassNames, GoeyToastPhase, GoeyToastTimings, GoeyToastType } from '../types'
import { SuccessIcon, ErrorIcon, WarningIcon, InfoIcon, SpinnerIcon } from '../icons'
import styles from './GoeyToast.module.css'

export interface GoeyToastProps {
  title: string
  description?: ReactNode
  type: GoeyToastType
  action?: GoeyToastAction
  icon?: ReactNode
  phase: GoeyToastPhase
  classNames?: GoeyToastClassNames
  fillColor?: string
  timing?: GoeyToastTimings
}

const phaseIconMap: Record<Exclude<GoeyToastPhase, 'loading'>, FC<{ size?: number; className?: string }>> = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
}

const titleColorMap: Record<GoeyToastPhase, string> = {
  loading: styles.titleLoading,
  success: styles.titleSuccess,
  error: styles.titleError,
  warning: styles.titleWarning,
  info: styles.titleInfo,
}

const actionColorMap: Record<GoeyToastPhase, string> = {
  loading: styles.actionInfo,
  success: styles.actionSuccess,
  error: styles.actionError,
  warning: styles.actionWarning,
  info: styles.actionInfo,
}

const PH = 34 // pill height constant

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
  const toaster = ol.closest('[data-sonner-toaster]') as HTMLElement | null
  const gap = toaster
    ? parseInt(getComputedStyle(toaster).getPropertyValue('--gap') || '14', 10)
    : 14

  const toasts = Array.from(
    ol.querySelectorAll(':scope > [data-sonner-toast]')
  ) as HTMLElement[]

  let offset = 0
  for (const t of toasts) {
    const content = t.firstElementChild as HTMLElement | null
    const height = content ? content.getBoundingClientRect().height : 0
    if (height > 0) {
      t.style.setProperty('--initial-height', `${height}px`)
      t.style.setProperty('--offset', `${offset}px`)
      offset += height + gap
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

export const GoeyToast: FC<GoeyToastProps> = ({
  title,
  description,
  action,
  icon,
  phase,
  classNames,
  fillColor = '#F2F1EC',
  timing,
}) => {
  // Action success override state
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const collapsingRef = useRef(false)
  const expandedDimsRef = useRef({ pw: 0, bw: 0, th: 0 })

  // Effective values (overridden when action success is active)
  const effectiveTitle = actionSuccess ?? title
  const effectivePhase: GoeyToastPhase = actionSuccess ? 'success' : phase
  const effectiveDescription = actionSuccess ? undefined : description
  const effectiveAction = actionSuccess ? undefined : action

  const isLoading = effectivePhase === 'loading'
  const hasDescription = Boolean(effectiveDescription)
  const hasAction = Boolean(effectiveAction)
  const isExpanded = hasDescription || hasAction

  const [showBody, setShowBody] = useState(false)

  // DOM refs
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Animation controllers
  const morphCtrl = useRef<ReturnType<typeof animate> | null>(null)
  const pillResizeCtrl = useRef<ReturnType<typeof animate> | null>(null)

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
    const t = morphTRef.current
    pathRef.current?.setAttribute('d', morphPath(p, b, h, t))

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
        wrapperRef.current.style.width = currentW + 'px'
      }
      if (contentRef.current) {
        contentRef.current.style.width = targetBw + 'px'
        contentRef.current.style.overflow = 'hidden'
        contentRef.current.style.maxHeight = currentH + 'px'
        contentRef.current.style.clipPath = `inset(0 ${targetBw - currentW}px 0 0)`
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

    const pw = headerRef.current.offsetWidth + 24
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

    pillResizeCtrl.current?.stop()
    pillResizeCtrl.current = animate(0, 1, {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (t) => {
        aDims.current = {
          pw: prev.pw + (target.pw - prev.pw) * t,
          bw: prev.bw + (target.bw - prev.bw) * t,
          th: prev.th + (target.th - prev.th) * t,
        }
        flush()
      },
    })
  }, [pw, bw, th, hasDims, showBody, flush])

  // Phase 1: expand (delay showBody) or collapse (reverse morph)
  useEffect(() => {
    if (isExpanded) {
      const t1 = setTimeout(() => setShowBody(true), timing?.expandDelay ?? 10)
      return () => clearTimeout(t1)
    }

    morphCtrl.current?.stop()
    pillResizeCtrl.current?.stop()

    // Reverse morph if currently expanded
    if (morphTRef.current > 0) {
      const savedDims = expandedDimsRef.current.bw > 0
        ? { ...expandedDimsRef.current }
        : { ...aDims.current }

      // Compute target compact pill dims from current header content
      // +24 matches compact CSS padding (left 10 + right 14) so pw = bw in compact
      const targetPw = headerRef.current ? headerRef.current.offsetWidth + 24 : savedDims.pw
      const targetDims = { pw: targetPw, bw: targetPw, th: PH }

      morphCtrl.current = animate(morphTRef.current, 0, {
        duration: timing?.collapseDuration ?? 0.4,
        ease: [0.4, 0, 0.2, 1],
        onUpdate: (t) => {
          morphTRef.current = t
          // Interpolate dims from expanded toward compact target
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
          setShowBody(false)
          aDims.current = { ...targetDims }
          flush()
        },
      })
      return () => { morphCtrl.current?.stop() }
    }

    setShowBody(false)
    morphTRef.current = 0
    flush()
  }, [isExpanded, flush])

  // Phase 2: morph from pill → blob
  useEffect(() => {
    if (!showBody) {
      morphTRef.current = 0
      morphCtrl.current?.stop()
      flush()
      return
    }

    const raf = requestAnimationFrame(() => {
      pillResizeCtrl.current?.stop()
      morphCtrl.current?.stop()
      // Capture current animated dims so we interpolate smoothly from
      // wherever the pill resize left off instead of snapping to target.
      const startDims = { ...aDims.current }
      morphCtrl.current = animate(0, 1, {
        duration: timing?.expandDuration ?? 0.6,
        ease: [0.4, 0, 0.2, 1],
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
  }, [showBody, flush])

  // Keep Sonner's toast stacking in sync when it re-renders (e.g. hover expand/collapse).
  // Sonner overwrites --offset/--initial-height with stale values from its React state,
  // so we observe style mutations on the toast list and re-apply correct heights.
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const ol = wrapper.closest('[data-sonner-toast]')?.parentElement
    if (!ol) return

    let applying = false
    const observer = new MutationObserver(() => {
      if (applying) return
      applying = true
      requestAnimationFrame(() => {
        syncSonnerHeights(wrapper)
        // Reset flag after a frame so subsequent Sonner re-renders are caught
        requestAnimationFrame(() => { applying = false })
      })
    })

    observer.observe(ol, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: true,
      childList: true,
    })

    return () => observer.disconnect()
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
    if (isLoading) return <SpinnerIcon size={18} />
    const IconComponent = phaseIconMap[effectivePhase]
    return <IconComponent size={18} />
  }

  const iconAndTitle = (
    <>
      <div className={`${styles.iconWrapper}${classNames?.icon ? ` ${classNames.icon}` : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={isLoading ? 'spinner' : effectivePhase}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            {renderIcon()}
          </motion.div>
        </AnimatePresence>
      </div>
      <span className={`${styles.title}${classNames?.title ? ` ${classNames.title}` : ''}`}>{effectiveTitle}</span>
    </>
  )

  return (
    <div ref={wrapperRef} className={`${styles.wrapper}${classNames?.wrapper ? ` ${classNames.wrapper}` : ''}`}>
      {/* SVG background — overflow visible, path controls shape */}
      <svg
        className={styles.blobSvg}
        aria-hidden
      >
        <path ref={pathRef} fill={fillColor} />
      </svg>

      {/* Content */}
      <div
        ref={contentRef}
        className={`${styles.content} ${showBody ? styles.contentExpanded : styles.contentCompact}${classNames?.content ? ` ${classNames.content}` : ''}`}
      >
        <div ref={headerRef} className={`${styles.header} ${titleColorMap[effectivePhase]}${classNames?.header ? ` ${classNames.header}` : ''}`}>
          {iconAndTitle}
        </div>

        <AnimatePresence>
          {showBody && hasDescription && (
            <motion.div
              key="description"
              className={`${styles.description}${classNames?.description ? ` ${classNames.description}` : ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              {effectiveDescription}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBody && hasAction && effectiveAction && (
            <motion.div
              key="action"
              className={`${styles.actionWrapper}${classNames?.actionWrapper ? ` ${classNames.actionWrapper}` : ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
            >
              <button
                className={`${styles.actionButton} ${actionColorMap[effectivePhase]}${classNames?.actionButton ? ` ${classNames.actionButton}` : ''}`}
                onClick={handleActionClick}
                type="button"
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
