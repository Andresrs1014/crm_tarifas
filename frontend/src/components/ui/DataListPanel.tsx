import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { PAGE_SIZE_OPTIONS, type PaginationState } from '../../hooks/usePagination'
import {
  computeViewportRatio,
  notifyTableScroll,
  registerTableScroll,
  updateTableScrollEntry,
} from '../../hooks/tableScrollManager'

/* ─── Scroll horizontal (HTML v6: #mr-table-wrap sin barra + track fijo) ─── */

export function TableScrollArea({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const instanceId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const body = wrapRef.current
    if (!body) return

    const getState = () => ({
      needsScroll: body.scrollWidth > body.clientWidth + 1,
      scrollWidth: body.scrollWidth,
      scrollLeft: body.scrollLeft,
      setScrollLeft: (value: number) => {
        body.scrollLeft = value
      },
    })

    return registerTableScroll({
      id: instanceId,
      ratio: 0,
      getState,
    })
  }, [instanceId])

  useEffect(() => {
    const body = wrapRef.current
    if (!body) return

    const refresh = () => {
      updateTableScrollEntry(instanceId, { ratio: computeViewportRatio(body) })
    }

    refresh()

    const main = document.querySelector('main.main')
    const ro = new ResizeObserver(refresh)
    ro.observe(body)
    if (body.firstElementChild instanceof HTMLElement) {
      ro.observe(body.firstElementChild)
    }

    const io = new IntersectionObserver(refresh, {
      root: null,
      rootMargin: '-60px 0px 0px 0px',
      threshold: [0, 0.05, 0.15, 0.35, 0.55, 0.75, 1],
    })
    io.observe(body)

    const onBodyScroll = () => {
      notifyTableScroll()
    }

    body.addEventListener('scroll', onBodyScroll, { passive: true })
    main?.addEventListener('scroll', refresh, { passive: true })
    window.addEventListener('resize', refresh)

    return () => {
      ro.disconnect()
      io.disconnect()
      body.removeEventListener('scroll', onBodyScroll)
      main?.removeEventListener('scroll', refresh)
      window.removeEventListener('resize', refresh)
    }
  }, [instanceId, children])

  return (
    <div ref={wrapRef} className={`page-gd-wrap ${className}`.trim()}>
      {children}
    </div>
  )
}

/* ─── Paginación ─── */

interface ListPaginationProps extends PaginationState {
  className?: string
}

export function ListPagination({
  page,
  setPage,
  pageSize,
  setPageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  className = '',
}: ListPaginationProps) {
  if (totalItems === 0) return null

  return (
    <div className={`list-pagination ${className}`.trim()}>
      <div className="list-pagination-info">
        {totalItems <= pageSize && totalPages === 1 ? (
          <span>{totalItems} registro{totalItems !== 1 ? 's' : ''}</span>
        ) : (
          <span>
            {startIndex}–{endIndex} de {totalItems}
          </span>
        )}
      </div>

      <div className="list-pagination-controls">
        <label className="list-pagination-size">
          <span className="sr-only">Filas por página</span>
          <select
            className="filter-select list-pagination-select"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="Filas por página"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} / pág.
              </option>
            ))}
          </select>
        </label>

        {totalPages > 1 && (
          <div className="list-pagination-pages">
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              title="Primera página"
            >
              «
            </button>
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              title="Anterior"
            >
              ‹
            </button>
            <span className="list-pagination-current">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              title="Siguiente"
            >
              ›
            </button>
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              title="Última página"
            >
              »
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Panel lista completo ─── */

interface DataListPanelProps {
  children: ReactNode
  header?: ReactNode
  className?: string
  loading?: boolean
  loadingRows?: number
  empty?: ReactNode
  pagination: PaginationState
  hidePagination?: boolean
}

export function DataListPanel({
  children,
  header,
  className = '',
  loading = false,
  loadingRows = 5,
  empty,
  pagination,
  hidePagination = false,
}: DataListPanelProps) {
  const showEmpty = !loading && pagination.totalItems === 0 && empty

  return (
    <div className={`table-card data-list-panel ${className}`.trim()}>
      {header}

      {loading ? (
        <div className="p-8 space-y-3">
          {[...Array(loadingRows)].map((_, i) => (
            <div key={i} className="h-10 bg-surface2 rounded animate-pulse" />
          ))}
        </div>
      ) : showEmpty ? (
        empty
      ) : (
        <>
          <TableScrollArea>{children}</TableScrollArea>
          {!hidePagination && <ListPagination {...pagination} />}
        </>
      )}
    </div>
  )
}
