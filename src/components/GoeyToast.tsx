import { useRef, useState, useEffect, useCallback, type FC, type ReactNode } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import type { GoeyToastAction, GoeyToastPhase, GoeyToastType } from '../types'
import { SuccessIcon, ErrorIcon, WarningIcon, InfoIcon, SpinnerIcon } from '../icons'
import styles from './GoeyToast.module.css'

export interface GoeyToastProps {
  title: string
  description?: string
  type: GoeyToastType
  action?: GoeyToastAction
  icon?: ReactNode
  phase: GoeyToastPhase
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

const PH = 34 // pill height constant

/**
 * Parametric morph path: pill lobe stays constant, body grows from underneath.
 * t=0 → pure pill, t=1 → full organic blob.
 */
function morphPath(pw: number, bw: number, th: number, t: number): string {
  const pr = PH / 2
  const pillW = Math.min(pw, bw)

  if (t <= 0) {
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
  const cr = Math.max(1, 16 * t)
  const bodyW = pillW + (bw - pillW) * t
  const bodyH = PH + (th - PH) * t
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
}) => {
  const isLoading = phase === 'loading'
  const hasDescription = Boolean(description)
  const hasAction = Boolean(action)
  const isExpanded = hasDescription || hasAction

  const [showBody, setShowBody] = useState(false)

  // DOM refs
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

  // Push current animated state to SVG DOM
  const flush = useCallback(() => {
    const { pw: p, bw: b, th: h } = aDims.current
    if (p <= 0 || b <= 0 || h <= 0) return
    pathRef.current?.setAttribute('d', morphPath(p, b, h, morphTRef.current))
  }, [])

  // Measure content dimensions
  const measure = useCallback(() => {
    if (headerRef.current && contentRef.current) {
      const pw = headerRef.current.offsetWidth + 28
      const bw = contentRef.current.offsetWidth
      const th = contentRef.current.offsetHeight
      setDims({ pw, bw, th })
    }
  }, [])

  useEffect(() => {
    measure()
    const t = setTimeout(measure, 100)
    return () => clearTimeout(t)
  }, [title, phase, isExpanded, showBody, description, action, measure])

  useEffect(() => {
    if (!contentRef.current) return
    const ro = new ResizeObserver(measure)
    ro.observe(contentRef.current)
    return () => ro.disconnect()
  }, [measure])

  const { pw, bw, th } = dims
  const hasDims = pw > 0 && bw > 0 && th > 0

  // Handle dims changes: pill resize animation (compact) or direct update (expanded)
  useEffect(() => {
    if (!hasDims) return

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
      duration: 0.3,
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

  // Phase 1: delay showBody
  useEffect(() => {
    if (isExpanded) {
      const t1 = setTimeout(() => setShowBody(true), 350)
      return () => clearTimeout(t1)
    }
    setShowBody(false)
    morphTRef.current = 0
    morphCtrl.current?.stop()
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
      morphCtrl.current = animate(0, 1, {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
        onUpdate: (t) => {
          morphTRef.current = t
          // Use latest measured dims so path tracks growing content
          aDims.current = { ...dimsRef.current }
          flush()
        },
      })
    })

    return () => {
      cancelAnimationFrame(raf)
      morphCtrl.current?.stop()
    }
  }, [showBody, flush])

  const renderIcon = () => {
    if (icon) return icon
    if (isLoading) return <SpinnerIcon size={18} />
    const IconComponent = phaseIconMap[phase]
    return <IconComponent size={18} />
  }

  const iconAndTitle = (
    <>
      <div className={styles.iconWrapper}>
        <AnimatePresence mode="wait">
          <motion.div
            key={isLoading ? 'spinner' : phase}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            {renderIcon()}
          </motion.div>
        </AnimatePresence>
      </div>
      <span className={styles.title}>{title}</span>
    </>
  )

  return (
    <div className={styles.wrapper}>
      {/* SVG background — fixed viewport, overflow visible, path controls shape */}
      <svg
        className={styles.blobSvg}
        aria-hidden
      >
        <path ref={pathRef} fill="#F2F1EC" />
      </svg>

      {/* Content */}
      <div
        ref={contentRef}
        className={`${styles.content} ${showBody ? styles.contentExpanded : styles.contentCompact}`}
      >
        <div ref={headerRef} className={`${styles.header} ${titleColorMap[phase]}`}>
          {iconAndTitle}
        </div>

        <AnimatePresence>
          {showBody && hasDescription && (
            <motion.div
              key="description"
              className={styles.description}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              {description}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBody && hasAction && action && (
            <motion.div
              key="action"
              className={styles.actionWrapper}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
            >
              <button
                className={styles.actionButton}
                onClick={action.onClick}
                type="button"
              >
                {action.label}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
