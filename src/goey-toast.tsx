import { useState, useEffect, useRef, type ReactNode } from 'react'
import { toast } from 'sonner'
import { GoeyToast } from './components/GoeyToast'
import { ToastErrorBoundary } from './components/ToastErrorBoundary'
import { getGoeyVisibleToasts } from './context'
import type {
  GoeyToastOptions,
  GoeyPromiseData,
  GoeyToastPhase,
  GoeyToastType,
  GoeyToastAction,
  GoeyToastClassNames,
  GoeyToastTimings,
} from './types'

const DEFAULT_EXPANDED_DURATION = 4000

// ---------------------------------------------------------------------------
// Toast queue — limits concurrent toasts to `visibleToasts` (default 3).
// Excess toasts wait in a FIFO queue and fire when a slot opens.
// ---------------------------------------------------------------------------
const _activeIds = new Set<string | number>()
const _queue: Array<{ id: string | number; create: () => void }> = []

/** @internal Reset queue state — exported for tests only. */
export function _resetQueue() {
  _activeIds.clear()
  _queue.length = 0
}

function _processQueue() {
  const max = getGoeyVisibleToasts()
  while (_queue.length > 0 && _activeIds.size < max) {
    const next = _queue.shift()!
    _activeIds.add(next.id)
    next.create()
  }
}

function _onToastDismissed(id: string | number) {
  if (!_activeIds.delete(id)) return
  _processQueue()
}

function GoeyToastWrapper({
  initialPhase,
  title,
  type,
  description,
  action,
  icon,
  classNames,
  fillColor,
  borderColor,
  borderWidth,
  timing,
  spring,
  bounce,
  toastId,
  activeId,
}: {
  initialPhase: GoeyToastPhase
  title: string
  type: GoeyToastType
  description?: ReactNode
  action?: GoeyToastAction
  icon?: ReactNode
  classNames?: GoeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  timing?: GoeyToastTimings
  spring?: boolean
  bounce?: number
  toastId?: string | number
  activeId: string | number
}) {
  // Guarantee the queue slot is freed when this toast unmounts from Sonner's DOM.
  // Uses a mounted ref + delayed check to survive React StrictMode's dev-only
  // double-mount cycle (mount → unmount → remount) without prematurely freeing the slot.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      setTimeout(() => {
        if (!mountedRef.current) _onToastDismissed(activeId)
      }, 100)
    }
  }, [activeId])

  return (
    <ToastErrorBoundary>
      <GoeyToast
        title={title}
        description={description}
        type={type}
        action={action}
        icon={icon}
        phase={initialPhase}
        classNames={classNames}
        fillColor={fillColor}
        borderColor={borderColor}
        borderWidth={borderWidth}
        timing={timing}
        spring={spring}
        bounce={bounce}
        toastId={toastId}
      />
    </ToastErrorBoundary>
  )
}

function PromiseToastWrapper<T>({
  promise,
  data,
  toastId,
}: {
  promise: Promise<T>
  data: GoeyPromiseData<T>
  toastId: string | number
}) {
  const [phase, setPhase] = useState<GoeyToastPhase>('loading')
  const [title, setTitle] = useState(data.loading)
  const [description, setDescription] = useState<ReactNode | undefined>(data.description?.loading)
  const [action, setAction] = useState<GoeyToastAction | undefined>(undefined)

  // Guarantee the queue slot is freed when this toast unmounts from Sonner's DOM.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      setTimeout(() => {
        if (!mountedRef.current) _onToastDismissed(toastId)
      }, 100)
    }
  }, [toastId])

  useEffect(() => {
    const resetDuration = (hasExpandedContent: boolean) => {
      const baseDuration = data.timing?.displayDuration ?? (hasExpandedContent ? DEFAULT_EXPANDED_DURATION : undefined)
      const collapseDurMs = 0.9 * 1000
      const duration = baseDuration != null && hasExpandedContent ? baseDuration + collapseDurMs : baseDuration
      if (duration != null) {
        toast.custom(() => (
          <PromiseToastWrapper promise={promise} data={data} toastId={toastId} />
        ), { id: toastId, duration })
      }
    }

    promise
      .then((result) => {
        const desc = typeof data.description?.success === 'function'
          ? data.description.success(result)
          : data.description?.success
        setTitle(
          typeof data.success === 'function'
            ? data.success(result)
            : data.success
        )
        setDescription(desc)
        setAction(data.action?.success)
        setPhase('success')
        resetDuration(Boolean(desc || data.action?.success))
      })
      .catch((err) => {
        const desc = typeof data.description?.error === 'function'
          ? data.description.error(err)
          : data.description?.error
        setTitle(
          typeof data.error === 'function' ? data.error(err) : data.error
        )
        setDescription(desc)
        setAction(data.action?.error)
        setPhase('error')
        resetDuration(Boolean(desc || data.action?.error))
      })
  }, [])

  return (
    <ToastErrorBoundary>
      <GoeyToast
        title={title}
        description={description}
        type={phase === 'loading' ? 'info' : (phase as GoeyToastType)}
        action={action}
        phase={phase}
        classNames={data.classNames}
        fillColor={data.fillColor}
        borderColor={data.borderColor}
        borderWidth={data.borderWidth}
        timing={data.timing}
        spring={data.spring}
        bounce={data.bounce}
      />
    </ToastErrorBoundary>
  )
}

function createGoeyToast(
  title: string,
  type: GoeyToastType,
  options?: GoeyToastOptions
) {
  const hasExpandedContent = Boolean(options?.description || options?.action)
  const baseDuration = options?.timing?.displayDuration ?? options?.duration ?? (options?.description ? DEFAULT_EXPANDED_DURATION : undefined)
  // Expanded toasts: Infinity duration, component controls dismiss (hover re-expand support)
  // Simple toasts: normal duration
  const duration = hasExpandedContent ? Infinity : baseDuration

  const toastId = options?.id ?? Math.random().toString(36).slice(2)

  const create = () => {
    toast.custom(
      () => (
        <GoeyToastWrapper
          initialPhase={type}
          title={title}
          type={type}
          description={options?.description}
          action={options?.action}
          icon={options?.icon}
          classNames={options?.classNames}
          fillColor={options?.fillColor}
          borderColor={options?.borderColor}
          borderWidth={options?.borderWidth}
          timing={options?.timing}
          spring={options?.spring}
          bounce={options?.bounce}
          toastId={hasExpandedContent ? toastId : undefined}
          activeId={toastId}
        />
      ),
      {
        duration,
        id: toastId,
      }
    )
  }

  if (_activeIds.size < getGoeyVisibleToasts()) {
    _activeIds.add(toastId)
    create()
  } else {
    _queue.push({ id: toastId, create })
  }

  return toastId
}

function dismissGoeyToast(id?: string | number) {
  if (id != null) {
    // Remove from queue if queued
    const idx = _queue.findIndex(q => q.id === id)
    if (idx !== -1) {
      _queue.splice(idx, 1)
      return
    }
    // Dismiss from Sonner — unmount cleanup in GoeyToastWrapper handles activeIds + queue
    toast.dismiss(id)
  } else {
    // Dismiss all: clear queue and dismiss all active toasts
    _queue.length = 0
    _activeIds.clear()
    toast.dismiss()
  }
}

export const goeyToast = Object.assign(
  (title: string, options?: GoeyToastOptions) =>
    createGoeyToast(title, 'default', options),
  {
    success: (title: string, options?: GoeyToastOptions) =>
      createGoeyToast(title, 'success', options),
    error: (title: string, options?: GoeyToastOptions) =>
      createGoeyToast(title, 'error', options),
    warning: (title: string, options?: GoeyToastOptions) =>
      createGoeyToast(title, 'warning', options),
    info: (title: string, options?: GoeyToastOptions) =>
      createGoeyToast(title, 'info', options),
    promise: <T,>(promise: Promise<T>, data: GoeyPromiseData<T>) => {
      const id = Math.random().toString(36).slice(2)

      const create = () => {
        toast.custom(() => (
          <PromiseToastWrapper promise={promise} data={data} toastId={id} />
        ), {
          id,
          duration: (data.timing?.displayDuration != null || data.description) ? Infinity : undefined,
        })
      }

      if (_activeIds.size < getGoeyVisibleToasts()) {
        _activeIds.add(id)
        create()
      } else {
        _queue.push({ id, create })
      }

      return id
    },
    dismiss: dismissGoeyToast,
  }
)
