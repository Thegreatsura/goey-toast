import type { ToasterProps } from 'sonner'

let _position: ToasterProps['position'] = 'bottom-right'
let _dir: 'ltr' | 'rtl' = 'ltr'
let _spring: boolean = true
let _bounce: number | undefined = undefined
let _theme: 'light' | 'dark' = 'light'

export function setGoeyTheme(theme: 'light' | 'dark') {
  _theme = theme
}

export function getGoeyTheme(): 'light' | 'dark' {
  return _theme
}

export function setGoeyPosition(position: ToasterProps['position']) {
  _position = position
}

export function getGoeyPosition() {
  return _position
}

export function setGoeyDir(dir: 'ltr' | 'rtl') {
  _dir = dir
}

export function getGoeyDir(): 'ltr' | 'rtl' {
  return _dir
}

export function setGoeySpring(spring: boolean) {
  _spring = spring
}

export function getGoeySpring() {
  return _spring
}

export function setGoeyBounce(bounce: number | undefined) {
  _bounce = bounce
}

export function getGoeyBounce() {
  return _bounce
}

let _visibleToasts = 3

export function setGoeyVisibleToasts(n: number) {
  _visibleToasts = n
}

export function getGoeyVisibleToasts() {
  return _visibleToasts
}

// ---------------------------------------------------------------------------
// Container hover — broadcast from GoeyToaster to all mounted GoeyToast instances
// so timers pause and re-expand triggers correctly when hovering the stack.
// ---------------------------------------------------------------------------
let _swipeToDismiss = true

export function setGoeySwipeToDismiss(enabled: boolean) {
  _swipeToDismiss = enabled
}

export function getGoeySwipeToDismiss() {
  return _swipeToDismiss
}

let _closeOnEscape = true

export function setGoeyCloseOnEscape(enabled: boolean) {
  _closeOnEscape = enabled
}

export function getGoeyCloseOnEscape() {
  return _closeOnEscape
}

let _maxQueue = Infinity

export function setGoeyMaxQueue(n: number) {
  _maxQueue = n
}

export function getGoeyMaxQueue() {
  return _maxQueue
}

let _queueOverflow: 'drop-oldest' | 'drop-newest' = 'drop-oldest'

export function setGoeyQueueOverflow(strategy: 'drop-oldest' | 'drop-newest') {
  _queueOverflow = strategy
}

export function getGoeyQueueOverflow() {
  return _queueOverflow
}

let _showProgress = false

export function setGoeyShowProgress(show: boolean) {
  _showProgress = show
}

export function getGoeyShowProgress() {
  return _showProgress
}

let _containerHovered = false
type HoverCb = (hovered: boolean) => void
const _hoverSubs: Set<HoverCb> = new Set()

export function setContainerHovered(hovered: boolean) {
  if (_containerHovered === hovered) return
  _containerHovered = hovered
  _hoverSubs.forEach(cb => cb(hovered))
}

export function getContainerHovered() {
  return _containerHovered
}

export function subscribeContainerHovered(cb: HoverCb): () => void {
  _hoverSubs.add(cb)
  return () => { _hoverSubs.delete(cb) }
}

// ---------------------------------------------------------------------------
// ARIA live region announcer — pushes text to a persistent live region so
// screen readers detect toast notifications reliably.
// ---------------------------------------------------------------------------
export type AriaLivePoliteness = 'polite' | 'assertive'

interface Announcement {
  message: string
  politeness: AriaLivePoliteness
}

type AnnounceCb = (announcement: Announcement) => void
const _announceSubs: Set<AnnounceCb> = new Set()

export function announce(message: string, politeness: AriaLivePoliteness = 'polite') {
  _announceSubs.forEach(cb => cb({ message, politeness }))
}

export function subscribeAnnouncements(cb: AnnounceCb): () => void {
  _announceSubs.add(cb)
  return () => { _announceSubs.delete(cb) }
}
