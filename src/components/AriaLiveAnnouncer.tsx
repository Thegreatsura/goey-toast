import { useEffect, useState, useCallback } from 'react'
import { subscribeAnnouncements } from '../context'

/**
 * Persistent ARIA live region that announces toast notifications to screen readers.
 *
 * Two regions are rendered (polite + assertive) so the correct politeness level
 * is used per toast type. Both regions are visually hidden but remain in the DOM
 * so screen readers can detect content changes reliably.
 *
 * Messages are cleared after a short delay to avoid stale announcements
 * accumulating in the live region.
 */
export function AriaLiveAnnouncer() {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')

  const handleAnnouncement = useCallback(({ message, politeness }: { message: string; politeness: 'polite' | 'assertive' }) => {
    if (politeness === 'assertive') {
      // Clear first to ensure re-announcement of identical messages
      setAssertiveMessage('')
      requestAnimationFrame(() => setAssertiveMessage(message))
    } else {
      setPoliteMessage('')
      requestAnimationFrame(() => setPoliteMessage(message))
    }
  }, [])

  useEffect(() => {
    return subscribeAnnouncements(handleAnnouncement)
  }, [handleAnnouncement])

  // Clear messages after screen reader has had time to announce them
  useEffect(() => {
    if (!politeMessage) return
    const t = setTimeout(() => setPoliteMessage(''), 7000)
    return () => clearTimeout(t)
  }, [politeMessage])

  useEffect(() => {
    if (!assertiveMessage) return
    const t = setTimeout(() => setAssertiveMessage(''), 7000)
    return () => clearTimeout(t)
  }, [assertiveMessage])

  const visuallyHidden: React.CSSProperties = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  }

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={visuallyHidden}
      >
        {politeMessage}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={visuallyHidden}
      >
        {assertiveMessage}
      </div>
    </>
  )
}
