import { useEffect, useMemo, useState } from 'react'

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

export interface UsePaginationOptions {
  pageSize?: number
  /** Cambian filtros → volver a página 1 */
  resetDeps?: readonly unknown[]
}

export function usePagination<T>(items: T[], options: UsePaginationOptions = {}) {
  const { pageSize: initialSize = 25, resetDeps = [] } = options
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialSize)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const safePage = Math.min(page, totalPages)

  useEffect(() => {
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, ...resetDeps])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, safePage, pageSize])

  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endIndex = Math.min(safePage * pageSize, totalItems)

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    pageItems,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
  }
}

export type PaginationState = ReturnType<typeof usePagination>
