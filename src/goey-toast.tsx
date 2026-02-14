import { useState, useEffect, type ReactNode } from 'react'
import { toast } from 'sonner'
import { GoeyToast } from './components/GoeyToast'
import type {
  GoeyToastOptions,
  GoeyPromiseData,
  GoeyToastPhase,
  GoeyToastType,
  GoeyToastAction,
  GoeyToastClassNames,
  GoeyToastTimings,
} from './types'

const DEFAULT_EXPANDED_DURATION = 6000

function GoeyToastWrapper({
  initialPhase,
  title,
  type,
  description,
  action,
  icon,
  classNames,
  fillColor,
  timing,
}: {
  initialPhase: GoeyToastPhase
  title: string
  type: GoeyToastType
  description?: ReactNode
  action?: GoeyToastAction
  icon?: ReactNode
  classNames?: GoeyToastClassNames
  fillColor?: string
  timing?: GoeyToastTimings
}) {
  return (
    <GoeyToast
      title={title}
      description={description}
      type={type}
      action={action}
      icon={icon}
      phase={initialPhase}
      classNames={classNames}
      fillColor={fillColor}
      timing={timing}
    />
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

  useEffect(() => {
    const resetDuration = (hasDescription: boolean) => {
      const duration = data.timing?.displayDuration ?? (hasDescription ? DEFAULT_EXPANDED_DURATION : undefined)
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
    <GoeyToast
      title={title}
      description={description}
      type={phase === 'loading' ? 'info' : (phase as GoeyToastType)}
      action={action}
      phase={phase}
      classNames={data.classNames}
      fillColor={data.fillColor}
      timing={data.timing}
    />
  )
}

function createGoeyToast(
  title: string,
  type: GoeyToastType,
  options?: GoeyToastOptions
) {
  return toast.custom(
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
        timing={options?.timing}
      />
    ),
    {
      duration: options?.timing?.displayDuration ?? options?.duration ?? (options?.description ? DEFAULT_EXPANDED_DURATION : undefined),
      id: options?.id,
    }
  )
}

export const goeyToast = Object.assign(
  (title: string, options?: GoeyToastOptions) =>
    createGoeyToast(title, 'info', options),
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
      return toast.custom(() => (
        <PromiseToastWrapper promise={promise} data={data} toastId={id} />
      ), {
        id,
        duration: (data.timing?.displayDuration != null || data.description) ? Infinity : undefined,
      })
    },
    dismiss: toast.dismiss,
  }
)
