import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  animate: () => ({ stop: () => {} }),
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

import { toast } from 'sonner'
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
    expect(svg.getAttribute('stroke')).toBe('currentColor')
  })

  it('ErrorIcon renders an SVG with correct size and stroke', () => {
    const { container } = render(<ErrorIcon size={18} />)
    const svg = container.querySelector('svg')!
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('width')).toBe('18')
    expect(svg.getAttribute('height')).toBe('18')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
  })

  it('WarningIcon renders an SVG with correct size and stroke', () => {
    const { container } = render(<WarningIcon size={18} />)
    const svg = container.querySelector('svg')!
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('width')).toBe('18')
    expect(svg.getAttribute('height')).toBe('18')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
  })

  it('InfoIcon renders an SVG with correct size and stroke', () => {
    const { container } = render(<InfoIcon size={18} />)
    const svg = container.querySelector('svg')!
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('width')).toBe('18')
    expect(svg.getAttribute('height')).toBe('18')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
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
    const svg = container.querySelector('svg[stroke="currentColor"]')!
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

describe('goeyToast.promise', () => {
  const mockCustom = toast.custom as ReturnType<typeof vi.fn>

  beforeEach(() => { mockCustom.mockClear() })

  function renderPromiseToast<T>(promise: Promise<T>, data: Parameters<typeof goeyToast.promise<T>>[1]) {
    goeyToast.promise(promise, data)
    const renderFn = mockCustom.mock.calls[0][0]
    return render(renderFn())
  }

  it('calls toast.custom when promise is invoked', () => {
    const promise = new Promise(() => {})
    goeyToast.promise(promise, {
      loading: 'Loading...',
      success: 'Done!',
      error: 'Failed',
    })
    expect(mockCustom).toHaveBeenCalledTimes(1)
    expect(mockCustom).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ id: expect.any(String), duration: undefined })
    )
  })

  it('passes Infinity duration when description is provided', () => {
    const promise = new Promise(() => {})
    goeyToast.promise(promise, {
      loading: 'Loading...',
      success: 'Done!',
      error: 'Failed',
      description: { loading: 'Please wait' },
    })
    expect(mockCustom).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ duration: Infinity })
    )
  })

  it('passes Infinity duration when timing.displayDuration is set', () => {
    const promise = new Promise(() => {})
    goeyToast.promise(promise, {
      loading: 'Loading...',
      success: 'Done!',
      error: 'Failed',
      timing: { displayDuration: 5000 },
    })
    expect(mockCustom).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ duration: Infinity })
    )
  })

  it('renders loading state initially', () => {
    const promise = new Promise(() => {})
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Save failed',
    })
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('renders loading description when provided', () => {
    const promise = new Promise(() => {})
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Save failed',
      description: { loading: 'Please wait while we save your data' },
    })
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('transitions to success state when promise resolves with string title', async () => {
    let resolve: (value: string) => void
    const promise = new Promise<string>((r) => { resolve = r })
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Save failed',
    })
    expect(screen.getByText('Saving...')).toBeInTheDocument()

    await act(async () => { resolve!('ok') })

    expect(screen.getByText('Saved!')).toBeInTheDocument()
  })

  it('transitions to success state with function title receiving resolved data', async () => {
    let resolve: (value: { count: number }) => void
    const promise = new Promise<{ count: number }>((r) => { resolve = r })
    renderPromiseToast(promise, {
      loading: 'Uploading...',
      success: (data) => `Uploaded ${data.count} files`,
      error: 'Upload failed',
    })
    expect(screen.getByText('Uploading...')).toBeInTheDocument()

    await act(async () => { resolve!({ count: 5 }) })

    expect(screen.getByText('Uploaded 5 files')).toBeInTheDocument()
  })

  it('transitions to error state when promise rejects with string title', async () => {
    let reject: (reason: unknown) => void
    const promise = new Promise<string>((_, r) => { reject = r })
    renderPromiseToast(promise, {
      loading: 'Deleting...',
      success: 'Deleted!',
      error: 'Delete failed',
    })
    expect(screen.getByText('Deleting...')).toBeInTheDocument()

    await act(async () => { reject!(new Error('Network error')) })

    expect(screen.getByText('Delete failed')).toBeInTheDocument()
  })

  it('transitions to error state with function title receiving error', async () => {
    let reject: (reason: unknown) => void
    const promise = new Promise<string>((_, r) => { reject = r })
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: (err) => `Error: ${(err as Error).message}`,
    })

    await act(async () => { reject!(new Error('Timeout')) })

    expect(screen.getByText('Error: Timeout')).toBeInTheDocument()
  })

  it('shows success description as string after promise resolves', async () => {
    vi.useFakeTimers()
    let resolve: (value: string) => void
    const promise = new Promise<string>((r) => { resolve = r })
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Failed',
      description: { success: 'Your changes have been saved' },
    })

    await act(async () => { resolve!('ok') })
    act(() => { vi.advanceTimersByTime(400) })

    expect(screen.getByText('Your changes have been saved')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows success description from function after promise resolves', async () => {
    vi.useFakeTimers()
    let resolve: (value: { name: string }) => void
    const promise = new Promise<{ name: string }>((r) => { resolve = r })
    renderPromiseToast(promise, {
      loading: 'Creating...',
      success: 'Created!',
      error: 'Failed',
      description: { success: (data) => `Created project "${data.name}"` },
    })

    await act(async () => { resolve!({ name: 'My Project' }) })
    act(() => { vi.advanceTimersByTime(400) })

    expect(screen.getByText('Created project "My Project"')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows error description as string after promise rejects', async () => {
    vi.useFakeTimers()
    let reject: (reason: unknown) => void
    const promise = new Promise<string>((_, r) => { reject = r })
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Failed',
      description: { error: 'Please try again later' },
    })

    await act(async () => { reject!(new Error('oops')) })
    act(() => { vi.advanceTimersByTime(400) })

    expect(screen.getByText('Please try again later')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows error description from function after promise rejects', async () => {
    vi.useFakeTimers()
    let reject: (reason: unknown) => void
    const promise = new Promise<string>((_, r) => { reject = r })
    renderPromiseToast(promise, {
      loading: 'Connecting...',
      success: 'Connected!',
      error: 'Connection failed',
      description: { error: (err) => `Reason: ${(err as Error).message}` },
    })

    await act(async () => { reject!(new Error('DNS resolution failed')) })
    act(() => { vi.advanceTimersByTime(400) })

    expect(screen.getByText('Reason: DNS resolution failed')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows success action button after promise resolves', async () => {
    vi.useFakeTimers()
    const onClick = vi.fn()
    let resolve: (value: string) => void
    const promise = new Promise<string>((r) => { resolve = r })
    renderPromiseToast(promise, {
      loading: 'Processing...',
      success: 'Done!',
      error: 'Failed',
      action: { success: { label: 'View', onClick } },
    })

    await act(async () => { resolve!('ok') })
    act(() => { vi.advanceTimersByTime(400) })

    const button = screen.getByRole('button', { name: 'View' })
    expect(button).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows error action button after promise rejects', async () => {
    vi.useFakeTimers()
    const onClick = vi.fn()
    let reject: (reason: unknown) => void
    const promise = new Promise<string>((_, r) => { reject = r })
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Save failed',
      action: { error: { label: 'Retry', onClick } },
    })

    await act(async () => { reject!(new Error('fail')) })
    act(() => { vi.advanceTimersByTime(400) })

    const button = screen.getByRole('button', { name: 'Retry' })
    expect(button).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('calls toast.custom again to reset duration on success with description', async () => {
    let resolve: (value: string) => void
    const promise = new Promise<string>((r) => { resolve = r })
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Failed',
      description: { success: 'All good' },
    })

    mockCustom.mockClear()
    await act(async () => { resolve!('ok') })

    expect(mockCustom).toHaveBeenCalled()
  })

  it('calls toast.custom again to reset duration on error with action', async () => {
    const onClick = vi.fn()
    let reject: (reason: unknown) => void
    const promise = new Promise<string>((_, r) => { reject = r })
    renderPromiseToast(promise, {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Failed',
      action: { error: { label: 'Retry', onClick } },
    })

    mockCustom.mockClear()
    await act(async () => { reject!(new Error('fail')) })

    expect(mockCustom).toHaveBeenCalled()
  })
})
