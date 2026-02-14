import type { ReactNode } from 'react'
import type { ExternalToast, ToasterProps } from 'sonner'

export type GoeyToastType = 'success' | 'error' | 'warning' | 'info'

export interface GoeyToastAction {
  label: string
  onClick: () => void
}

export interface GoeyToastData {
  title: string
  description?: string
  type: GoeyToastType
  action?: GoeyToastAction
  icon?: ReactNode
  duration?: number
}

export interface GoeyToastOptions {
  description?: string
  action?: GoeyToastAction
  icon?: ReactNode
  duration?: number
  id?: string | number
}

export interface GoeyPromiseData<T> {
  loading: string
  success: string | ((data: T) => string)
  error: string | ((error: unknown) => string)
  description?: {
    loading?: string
    success?: string | ((data: T) => string)
    error?: string | ((error: unknown) => string)
  }
  action?: {
    success?: GoeyToastAction
    error?: GoeyToastAction
  }
}

export type GoeyToastPhase = 'loading' | 'success' | 'error' | 'warning' | 'info'

export interface GoeyToasterProps {
  position?: ToasterProps['position']
  duration?: number
  gap?: number
  offset?: number | string
  theme?: 'light' | 'dark'
  toastOptions?: Partial<ExternalToast>
}
