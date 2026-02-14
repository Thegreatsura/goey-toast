import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GoeyToaster } from '../components/GoeyToaster'

describe('GoeyToaster', () => {
  it('renders without crashing', () => {
    const { container } = render(<GoeyToaster />)
    expect(container).toBeDefined()
  })

  it('renders with custom position', () => {
    const { container } = render(<GoeyToaster position="top-center" />)
    expect(container).toBeDefined()
  })

  it('renders with all props', () => {
    const { container } = render(
      <GoeyToaster
        position="top-right"
        duration={5000}
        gap={20}
        offset="32px"
        theme="dark"
      />
    )
    expect(container).toBeDefined()
  })
})
