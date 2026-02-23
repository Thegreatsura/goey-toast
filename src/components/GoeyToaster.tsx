import { useEffect } from 'react'
import { Toaster } from 'sonner'
import type { GoeyToasterProps } from '../types'
import { setGoeyPosition, setGoeySpring, setGoeyBounce, setContainerHovered } from '../context'

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
  spring = true,
  bounce,
}: GoeyToasterProps) {
  useEffect(() => {
    setGoeyPosition(position)
  }, [position])

  useEffect(() => {
    setGoeySpring(spring)
  }, [spring])

  useEffect(() => {
    setGoeyBounce(bounce)
  }, [bounce])

  // Detect hover on the Sonner container and broadcast to all GoeyToast instances.
  // This ensures timers pause and re-expand fires when hovering any part of the stack,
  // not just the individual toast wrapper the cursor happens to be directly over.
  useEffect(() => {
    const onEnter = () => setContainerHovered(true)
    const onLeave = () => setContainerHovered(false)

    const attach = (el: HTMLElement) => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    }

    // The [data-sonner-toaster] element may not exist yet — wait for it.
    let el = document.querySelector<HTMLElement>('[data-sonner-toaster]')
    if (el) {
      attach(el)
      return () => {
        el!.removeEventListener('mouseenter', onEnter)
        el!.removeEventListener('mouseleave', onLeave)
        setContainerHovered(false)
      }
    }

    const obs = new MutationObserver(() => {
      const found = document.querySelector<HTMLElement>('[data-sonner-toaster]')
      if (found) {
        obs.disconnect()
        el = found
        attach(el)
      }
    })
    obs.observe(document.body, { childList: true, subtree: true })

    return () => {
      obs.disconnect()
      el?.removeEventListener('mouseenter', onEnter)
      el?.removeEventListener('mouseleave', onLeave)
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
      visibleToasts={visibleToasts}
      dir={dir}
    />
  )
}
