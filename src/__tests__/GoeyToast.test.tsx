import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GoeyToast } from '../components/GoeyToast'

describe('GoeyToast', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders title text', () => {
    render(<GoeyToast title="Loading..." type="success" phase="loading" />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders in compact pill shape during loading phase', () => {
    const { container } = render(
      <GoeyToast title="Loading..." type="success" phase="loading" />
    )
    const contentEl = container.querySelector('[class*="content"]') as HTMLElement
    expect(contentEl.className).toContain('Compact')
    expect(contentEl.className).not.toContain('Expanded')
  })

  it('renders in compact pill shape for result without description', () => {
    const { container } = render(
      <GoeyToast title="Done!" type="success" phase="success" />
    )
    const contentEl = container.querySelector('[class*="content"]') as HTMLElement
    expect(contentEl.className).toContain('Compact')
  })

  it('renders in expanded shape when description is provided', () => {
    const { container } = render(
      <GoeyToast
        title="Done!"
        description="Your file was saved."
        type="success"
        phase="success"
      />
    )
    // Advance past the showBody delay
    act(() => { vi.advanceTimersByTime(400) })
    const contentEl = container.querySelector('[class*="content"]') as HTMLElement
    expect(contentEl.className).toContain('Expanded')
    expect(screen.getByText('Your file was saved.')).toBeInTheDocument()
  })

  it('renders action button when action is provided', () => {
    const onClick = vi.fn()
    render(
      <GoeyToast
        title="Error"
        description="Something went wrong."
        type="error"
        phase="error"
        action={{ label: 'Retry', onClick }}
      />
    )
    act(() => { vi.advanceTimersByTime(400) })
    const button = screen.getByRole('button', { name: 'Retry' })
    expect(button).toBeInTheDocument()
  })

  it('calls action onClick when button is clicked', () => {
    const onClick = vi.fn()
    render(
      <GoeyToast
        title="Error"
        description="Something went wrong."
        type="error"
        phase="error"
        action={{ label: 'Retry', onClick }}
      />
    )
    act(() => { vi.advanceTimersByTime(400) })
    const button = screen.getByRole('button', { name: 'Retry' })
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not render description when not provided', () => {
    render(<GoeyToast title="Done!" type="success" phase="success" />)
    const desc = document.querySelector('[class*="description"]')
    expect(desc).toBeNull()
  })

  it('does not render action button when action is not provided', () => {
    render(<GoeyToast title="Done!" type="success" phase="success" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders custom icon when provided', () => {
    render(
      <GoeyToast
        title="Custom"
        type="info"
        phase="info"
        icon={<span data-testid="custom-icon">*</span>}
      />
    )
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })
})
