import { useState, useEffect, type ReactNode } from 'react'
import { toast } from 'sonner'
import { GoeyToast } from './components/GoeyToast'
import type {
  GoeyToastOptions,
  GoeyPromiseData,
  GoeyToastPhase,
  GoeyToastType,
  GoeyToastAction,
} from './types'

function GoeyToastWrapper({
  initialPhase,
  title,
  type,
  description,
  action,
  icon,
}: {
  initialPhase: GoeyToastPhase
  title: string
  type: GoeyToastType
  description?: string
  action?: GoeyToastAction
  icon?: ReactNode
}) {
  return (
    <GoeyToast
      title={title}
      description={description}
      type={type}
      action={action}
      icon={icon}
      phase={initialPhase}
    />
  )
}

function PromiseToastWrapper<T>({
  promise,
  data,
}: {
  promise: Promise<T>
  data: GoeyPromiseData<T>
}) {
  const [phase, setPhase] = useState<GoeyToastPhase>('loading')
  const [title, setTitle] = useState(data.loading)
  const [description, setDescription] = useState(data.description?.loading)
  const [action, setAction] = useState<GoeyToastAction | undefined>(undefined)

  useEffect(() => {
    promise
      .then((result) => {
        setTitle(
          typeof data.success === 'function'
            ? data.success(result)
            : data.success
        )
        setDescription(
          typeof data.description?.success === 'function'
            ? data.description.success(result)
            : data.description?.success
        )
        setAction(data.action?.success)
        setPhase('success')
      })
      .catch((err) => {
        setTitle(
          typeof data.error === 'function' ? data.error(err) : data.error
        )
        setDescription(
          typeof data.description?.error === 'function'
            ? data.description.error(err)
            : data.description?.error
        )
        setAction(data.action?.error)
        setPhase('error')
      })
  }, [])

  return (
    <GoeyToast
      title={title}
      description={description}
      type={phase === 'loading' ? 'info' : (phase as GoeyToastType)}
      action={action}
      phase={phase}
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
      />
    ),
    { duration: options?.duration, id: options?.id }
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
      return toast.custom(() => (
        <PromiseToastWrapper promise={promise} data={data} />
      ))
    },
    dismiss: toast.dismiss,
  }
)
