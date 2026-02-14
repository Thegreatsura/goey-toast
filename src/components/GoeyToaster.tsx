import { Toaster } from 'sonner'
import type { GoeyToasterProps } from '../types'

export function GoeyToaster({
  position = 'bottom-right',
  duration,
  gap = 14,
  offset = '24px',
  theme = 'light',
  toastOptions,
}: GoeyToasterProps) {
  return (
    <Toaster
      position={position}
      duration={duration}
      gap={gap}
      offset={offset}
      theme={theme}
      toastOptions={{ unstyled: true, ...toastOptions }}
    />
  )
}
