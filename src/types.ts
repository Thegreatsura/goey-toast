import type { ReactNode } from 'react'
import type { ExternalToast, ToasterProps } from 'sonner'

export type GoeyToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

export interface GoeyToastTimings {
  squishDelay?: number
  expandDelay?: number
  expandDuration?: number
  collapseDuration?: number
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
  spring?: boolean
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
  spring?: boolean
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
  spring?: boolean
}

export type GoeyToastPhase = 'loading' | 'default' | 'success' | 'error' | 'warning' | 'info'

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
  spring?: boolean
}
