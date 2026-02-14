import type { FC } from 'react'

interface SpinnerIconProps {
  size?: number
  className?: string
}

export const SpinnerIcon: FC<SpinnerIconProps> = ({ size = 20, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ animation: 'goey-spin 1s linear infinite' }}
  >
    <style>{`@keyframes goey-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)
