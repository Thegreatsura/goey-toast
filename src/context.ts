import type { ToasterProps } from 'sonner'

let _position: ToasterProps['position'] = 'bottom-right'
let _spring: boolean = true
let _bounce: number | undefined = undefined

export function setGoeyPosition(position: ToasterProps['position']) {
  _position = position
}

export function getGoeyPosition() {
  return _position
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

// ---------------------------------------------------------------------------
// Container hover — broadcast from GoeyToaster to all mounted GoeyToast instances
// so timers pause and re-expand triggers correctly when hovering the stack.
// ---------------------------------------------------------------------------
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
