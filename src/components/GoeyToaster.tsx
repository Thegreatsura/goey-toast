import { useEffect } from 'react'
import { Toaster } from 'sonner'
import type { GoeyToasterProps } from '../types'
import { animationPresets } from '../presets'
import { setGoeyPosition, setGoeyDir, setGoeySpring, setGoeyBounce, setGoeyVisibleToasts, setContainerHovered, setGoeySwipeToDismiss, setGoeyCloseOnEscape, setGoeyTheme, setGoeyMaxQueue, setGoeyQueueOverflow, setGoeyShowProgress } from '../context'
import { goeyToast, _getMostRecentActiveId } from '../goey-toast'
import { AriaLiveAnnouncer } from './AriaLiveAnnouncer'

export function GoeyToaster({
  position = 'bottom-right',
  duration,
  gap = 14,
  offset = '24px',
  theme = 'light',
  toastOptions,
  expand,
  closeButton,
  richColors,
  visibleToasts,
  dir,
  preset,
  spring,
  bounce,
  swipeToDismiss = true,
  closeOnEscape = true,
  maxQueue = Infinity,
  queueOverflow = 'drop-oldest',
  showProgress = false,
}: GoeyToasterProps) {
  const presetConfig = preset ? animationPresets[preset] : undefined
  const resolvedSpring = spring ?? presetConfig?.spring ?? true
  const resolvedBounce = bounce ?? presetConfig?.bounce

  useEffect(() => {
    setGoeyPosition(position)
  }, [position])

  useEffect(() => {
    setGoeyDir(dir ?? 'ltr')
  }, [dir])

  useEffect(() => {
    setGoeyTheme(theme)
  }, [theme])

  useEffect(() => {
    setGoeySpring(resolvedSpring)
  }, [resolvedSpring])

  useEffect(() => {
    setGoeyBounce(resolvedBounce)
  }, [resolvedBounce])

  useEffect(() => {
    setGoeySwipeToDismiss(swipeToDismiss)
  }, [swipeToDismiss])

  useEffect(() => {
    setGoeyCloseOnEscape(closeOnEscape)
  }, [closeOnEscape])

  useEffect(() => {
    if (!closeOnEscape) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const recentId = _getMostRecentActiveId()
        if (recentId != null) {
          goeyToast.dismiss(recentId)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeOnEscape])

  useEffect(() => {
    setGoeyVisibleToasts(visibleToasts ?? 3)
  }, [visibleToasts])

  useEffect(() => {
    setGoeyMaxQueue(maxQueue)
  }, [maxQueue])

  useEffect(() => {
    setGoeyQueueOverflow(queueOverflow)
  }, [queueOverflow])

  useEffect(() => {
    setGoeyShowProgress(showProgress)
  }, [showProgress])

  // Detect hover on the Sonner container and broadcast to all GoeyToast instances.
  // Uses Sonner's `data-expanded` attribute (set per-toast <li>) as the hover signal
  // rather than raw mouseenter/mouseleave on the <ol>. This is more reliable because
  // Sonner manages it with onMouseEnter + onMouseMove + onMouseLeave, and it survives
  // <ol> remounts (all toasts dismissed then new ones appear).
  useEffect(() => {
    let expandObs: MutationObserver | null = null
    let currentOl: HTMLElement | null = null

    const syncFromExpanded = (ol: HTMLElement) => {
      const anyExpanded = ol.querySelector('[data-sonner-toast][data-expanded="true"]') !== null
      setContainerHovered(anyExpanded)
    }

    const attach = (ol: HTMLElement) => {
      if (ol === currentOl) return
      expandObs?.disconnect()
      currentOl = ol
      expandObs = new MutationObserver(() => syncFromExpanded(ol))
      expandObs.observe(ol, { attributes: true, attributeFilter: ['data-expanded'], subtree: true })
      syncFromExpanded(ol)
    }

    const el = document.querySelector<HTMLElement>('[data-sonner-toaster]')
    if (el) attach(el)

    // Re-discover if the <ol> is remounted (e.g. all toasts dismissed then new ones appear).
    // Debounce via rAF to coalesce rapid DOM mutations (e.g. multiple toasts mounting).
    let bodyRafId = 0
    const bodyObs = new MutationObserver(() => {
      if (bodyRafId) return
      bodyRafId = requestAnimationFrame(() => {
        bodyRafId = 0
        const found = document.querySelector<HTMLElement>('[data-sonner-toaster]')
        if (found) {
          attach(found)
        } else if (currentOl) {
          expandObs?.disconnect()
          currentOl = null
          setContainerHovered(false)
        }
      })
    })
    bodyObs.observe(document.body, { childList: true, subtree: true })

    return () => {
      if (bodyRafId) cancelAnimationFrame(bodyRafId)
      bodyObs.disconnect()
      expandObs?.disconnect()
      setContainerHovered(false)
    }
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const el = document.createElement('div')
    el.setAttribute('data-goey-toast-css', '')
    el.style.position = 'absolute'
    el.style.width = '0'
    el.style.height = '0'
    el.style.overflow = 'hidden'
    el.style.pointerEvents = 'none'
    document.body.appendChild(el)

    const value = getComputedStyle(el).getPropertyValue('--goey-toast')
    document.body.removeChild(el)

    if (!value) {
      console.warn(
        '[goey-toast] Styles not found. Make sure to import the CSS:\n\n' +
        '  import "goey-toast/styles.css";\n'
      )
    }
  }, [])

  return (
    <>
      <Toaster
        position={position}
        duration={duration}
        gap={gap}
        offset={offset}
        theme={theme}
        toastOptions={{ unstyled: true, ...toastOptions }}
        expand={expand}
        closeButton={closeButton}
        richColors={richColors}
        visibleToasts={99}
        dir={dir}
      />
      <AriaLiveAnnouncer />
    </>
  )
}
