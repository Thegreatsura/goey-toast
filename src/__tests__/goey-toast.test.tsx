import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('sonner', () => ({
  toast: {
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: ({ children, ...props }: any) => (
    <div data-testid="sonner-toaster" {...props}>
      {children}
    </div>
  ),
}))

import { SuccessIcon, ErrorIcon, WarningIcon, InfoIcon, SpinnerIcon } from '../icons'
import { GoeyToast } from '../components/GoeyToast'
import { GoeyToaster } from '../components/GoeyToaster'
import { goeyToast } from '../goey-toast'

describe('Icon components', () => {
  it('SuccessIcon renders an SVG with correct size and stroke', () => {
    const { container } = render(<SuccessIcon size={18} />)
    const svg = container.querySelector('svg')!
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('width')).toBe('18')
    expect(svg.getAttribute('height')).toBe('18')
    expect(svg.getAttribute('stroke')).toBe('#4CAF50')
  })

  it('ErrorIcon renders an SVG with correct size and stroke', () => {
    const { container } = render(<ErrorIcon size={18} />)
    const svg = container.querySelector('svg')!
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('width')).toBe('18')
    expect(svg.getAttribute('height')).toBe('18')
    expect(svg.getAttribute('stroke')).toBe('#F44336')
  })

  it('WarningIcon renders an SVG with correct size and stroke', () => {
    const { container } = render(<WarningIcon size={18} />)
    const svg = container.querySelector('svg')!
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('width')).toBe('18')
    expect(svg.getAttribute('height')).toBe('18')
    expect(svg.getAttribute('stroke')).toBe('#D4A017')
  })

  it('InfoIcon renders an SVG with correct size and stroke', () => {
    const { container } = render(<InfoIcon size={18} />)
    const svg = container.querySelector('svg')!
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('width')).toBe('18')
    expect(svg.getAttribute('height')).toBe('18')
    expect(svg.getAttribute('stroke')).toBe('#2196F3')
  })

  it('SpinnerIcon renders an SVG with spin animation', () => {
    const { container } = render(<SpinnerIcon size={18} />)
    const svg = container.querySelector('svg')!
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('width')).toBe('18')
    expect(svg.getAttribute('height')).toBe('18')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
  })
})

describe('GoeyToast component', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders in compact mode with title only', () => {
    render(
      <GoeyToast
        title="Success!"
        type="success"
        phase="success"
      />
    )
    expect(screen.getByText('Success!')).toBeInTheDocument()
  })

  it('renders in expanded mode with title and description', () => {
    render(
      <GoeyToast
        title="Warning"
        description="Something needs attention"
        type="warning"
        phase="warning"
      />
    )
    act(() => { vi.advanceTimersByTime(400) })
    expect(screen.getByText('Warning')).toBeInTheDocument()
    expect(screen.getByText('Something needs attention')).toBeInTheDocument()
  })

  it('renders action button with correct label', () => {
    const onClick = vi.fn()
    render(
      <GoeyToast
        title="Error occurred"
        type="error"
        phase="error"
        action={{ label: 'Retry', onClick }}
      />
    )
    act(() => { vi.advanceTimersByTime(400) })
    const button = screen.getByRole('button', { name: 'Retry' })
    expect(button).toBeInTheDocument()
  })

  it('renders spinner icon in loading state', () => {
    const { container } = render(
      <GoeyToast
        title="Loading..."
        type="info"
        phase="loading"
      />
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    const svg = container.querySelector('svg')!
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('stroke')).toBe('currentColor')
  })

  it('calls action onClick when button is clicked', () => {
    const onClick = vi.fn()
    render(
      <GoeyToast
        title="Error"
        type="error"
        phase="error"
        action={{ label: 'Retry', onClick }}
      />
    )
    act(() => { vi.advanceTimersByTime(400) })
    const button = screen.getByRole('button', { name: 'Retry' })
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('GoeyToaster', () => {
  it('renders without crashing', () => {
    const { container } = render(<GoeyToaster />)
    expect(container).toBeTruthy()
  })
})

describe('goeyToast API', () => {
  it('has success method as a function', () => {
    expect(typeof goeyToast.success).toBe('function')
  })

  it('has error method as a function', () => {
    expect(typeof goeyToast.error).toBe('function')
  })

  it('has warning method as a function', () => {
    expect(typeof goeyToast.warning).toBe('function')
  })

  it('has info method as a function', () => {
    expect(typeof goeyToast.info).toBe('function')
  })

  it('has promise method as a function', () => {
    expect(typeof goeyToast.promise).toBe('function')
  })

  it('has dismiss method as a function', () => {
    expect(typeof goeyToast.dismiss).toBe('function')
  })
})
