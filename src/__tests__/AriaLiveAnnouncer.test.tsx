import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { AriaLiveAnnouncer } from '../components/AriaLiveAnnouncer'
import { announce } from '../context'

describe('AriaLiveAnnouncer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders two visually-hidden live regions', () => {
    render(<AriaLiveAnnouncer />)
    const polite = screen.getByRole('status')
    const assertive = screen.getByRole('alert')
    expect(polite).toBeInTheDocument()
    expect(assertive).toBeInTheDocument()
    expect(polite.getAttribute('aria-live')).toBe('polite')
    expect(assertive.getAttribute('aria-live')).toBe('assertive')
    expect(polite.getAttribute('aria-atomic')).toBe('true')
    expect(assertive.getAttribute('aria-atomic')).toBe('true')
  })

  it('visually hides the live regions', () => {
    render(<AriaLiveAnnouncer />)
    const polite = screen.getByRole('status')
    expect(polite.style.position).toBe('absolute')
    expect(polite.style.width).toBe('1px')
    expect(polite.style.height).toBe('1px')
    expect(polite.style.overflow).toBe('hidden')
  })

  it('announces polite messages in the status region', async () => {
    render(<AriaLiveAnnouncer />)
    const polite = screen.getByRole('status')

    // Mock requestAnimationFrame for synchronous test
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })

    act(() => {
      announce('File saved successfully', 'polite')
    })

    expect(polite.textContent).toBe('File saved successfully')
  })

  it('announces assertive messages in the alert region', () => {
    render(<AriaLiveAnnouncer />)
    const assertive = screen.getByRole('alert')

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })

    act(() => {
      announce('Something went wrong', 'assertive')
    })

    expect(assertive.textContent).toBe('Something went wrong')
  })

  it('defaults to polite politeness', () => {
    render(<AriaLiveAnnouncer />)
    const polite = screen.getByRole('status')

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })

    act(() => {
      announce('Hello world')
    })

    expect(polite.textContent).toBe('Hello world')
  })
})
