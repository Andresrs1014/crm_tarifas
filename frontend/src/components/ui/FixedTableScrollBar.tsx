import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import {
  getActiveTableScroll,
  getMainContentRect,
  getTableScrollEntry,
  lockTableScroll,
  subscribeTableScroll,
} from '../../hooks/tableScrollManager'

function getSnapshot() {
  const active = getActiveTableScroll()
  if (!active) return ''
  const { id, ratio, state } = active
  return `${id}|${ratio}|${state.scrollLeft}|${state.scrollWidth}|${state.needsScroll}`
}

/**
 * Barra horizontal fija abajo (HTML v6: #mr-fixed-scroll / #gd-scroll-track).
 */
export function FixedTableScrollBar() {
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const lockedIdRef = useRef<string | null>(null)

  useSyncExternalStore(subscribeTableScroll, getSnapshot)

  const active = getActiveTableScroll()
  const show = !!active?.state.needsScroll

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track || !show || !active) return

    const { left, width } = getMainContentRect()
    track.style.left = `${left}px`
    track.style.width = `${width}px`

    const spacer = track.querySelector<HTMLElement>('.table-scroll-spacer')
    if (spacer) spacer.style.width = `${active.state.scrollWidth}px`

    if (!draggingRef.current) {
      track.scrollLeft = active.state.scrollLeft
    }
  }, [show, active?.id, active?.state.scrollWidth, active?.state.scrollLeft])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const syncFromTrack = () => {
      const id = lockedIdRef.current ?? getActiveTableScroll()?.id
      if (!id) return
      const entry = getTableScrollEntry(id)
      entry?.getState().setScrollLeft(track.scrollLeft)
    }

    const onPointerDown = () => {
      const current = getActiveTableScroll()
      if (!current) return
      draggingRef.current = true
      lockedIdRef.current = current.id
      lockTableScroll(current.id)
    }

    const onPointerUp = () => {
      draggingRef.current = false
      lockedIdRef.current = null
      lockTableScroll(null)
    }

    track.addEventListener('scroll', syncFromTrack, { passive: true })
    track.addEventListener('mousedown', onPointerDown)
    track.addEventListener('touchstart', onPointerDown, { passive: true })
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('touchend', onPointerUp)

    const main = document.querySelector('main.main')
    const onMainScroll = () => {
      if (draggingRef.current || !trackRef.current || !show) return
      const current = getActiveTableScroll()
      if (!current) return
      trackRef.current.scrollLeft = current.state.scrollLeft
    }

    main?.addEventListener('scroll', onMainScroll, { passive: true })
    window.addEventListener('resize', onMainScroll)

    return () => {
      track.removeEventListener('scroll', syncFromTrack)
      track.removeEventListener('mousedown', onPointerDown)
      track.removeEventListener('touchstart', onPointerDown)
      window.removeEventListener('mouseup', onPointerUp)
      window.removeEventListener('touchend', onPointerUp)
      main?.removeEventListener('scroll', onMainScroll)
      window.removeEventListener('resize', onMainScroll)
    }
  }, [show])

  useEffect(() => {
    const main = document.querySelector('main.main')
    main?.classList.toggle('main--has-h-scroll', show)
    return () => main?.classList.remove('main--has-h-scroll')
  }, [show])

  return createPortal(
    <div
      ref={trackRef}
      className="table-fixed-scroll"
      aria-label="Desplazamiento horizontal"
      role="scrollbar"
      aria-orientation="horizontal"
      aria-hidden={!show}
      style={{
        visibility: show ? 'visible' : 'hidden',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      <div className="table-scroll-spacer" aria-hidden="true" />
    </div>,
    document.body,
  )
}
