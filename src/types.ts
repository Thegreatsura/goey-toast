import type { ReactNode } from 'react'
import type { ExternalToast, ToasterProps } from 'sonner'
import type { AnimationPresetName } from './presets'

export type GoeyToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

export interface GoeyToastTimings {
  displayDuration?: number
}

export interface GoeyToastClassNames {
  wrapper?: string
  content?: string
  header?: string
  title?: string
  icon?: string
  description?: string
  actionWrapper?: string
  actionButton?: string
}

export interface GoeyToastAction {
  label: string
  onClick: () => void
  successLabel?: string
}

export interface GoeyToastData {
  title: string
  description?: ReactNode
  type: GoeyToastType
  action?: GoeyToastAction
  icon?: ReactNode
  duration?: number
  classNames?: GoeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  preset?: AnimationPresetName
  spring?: boolean
  bounce?: number
}

export interface GoeyToastOptions {
  description?: ReactNode
  action?: GoeyToastAction
  icon?: ReactNode
  duration?: number
  id?: string | number
  classNames?: GoeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  timing?: GoeyToastTimings
  preset?: AnimationPresetName
  spring?: boolean
  bounce?: number
  showProgress?: boolean
  onDismiss?: (id: string | number) => void
  onAutoClose?: (id: string | number) => void
}

export interface GoeyPromiseData<T> {
  loading: string
  success: string | ((data: T) => string)
  error: string | ((error: unknown) => string)
  description?: {
    loading?: ReactNode
    success?: ReactNode | ((data: T) => ReactNode)
    error?: ReactNode | ((error: unknown) => ReactNode)
  }
  action?: {
    success?: GoeyToastAction
    error?: GoeyToastAction
  }
  classNames?: GoeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  timing?: GoeyToastTimings
  preset?: AnimationPresetName
  spring?: boolean
  bounce?: number
  onDismiss?: (id: string | number) => void
  onAutoClose?: (id: string | number) => void
}

export type GoeyToastPhase = 'loading' | 'default' | 'success' | 'error' | 'warning' | 'info'

export interface GoeyToastUpdateOptions {
  title?: string
  description?: ReactNode
  type?: GoeyToastType
  action?: GoeyToastAction
  icon?: ReactNode | null
}

export interface DismissFilter {
  type: GoeyToastType | GoeyToastType[]
}

export interface GoeyToasterProps {
  position?: ToasterProps['position']
  duration?: number
  gap?: number
  offset?: number | string
  theme?: 'light' | 'dark'
  toastOptions?: Partial<ExternalToast>
  expand?: boolean
  closeButton?: boolean
  richColors?: boolean
  visibleToasts?: number
  dir?: 'ltr' | 'rtl'
  preset?: AnimationPresetName
  spring?: boolean
  bounce?: number
  swipeToDismiss?: boolean
  closeOnEscape?: boolean
  maxQueue?: number
  queueOverflow?: 'drop-oldest' | 'drop-newest'
  showProgress?: boolean
}
