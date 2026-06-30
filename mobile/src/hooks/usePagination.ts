import { useCallback, useEffect, useMemo, useState } from 'react';

const DEFAULT_PAGE_SIZE = 20;

export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [items.length, pageSize]);

  const visible = useMemo(() => items.slice(0, page * pageSize), [items, page, pageSize]);
  const hasMore = visible.length < items.length;
  const total = items.length;

  const loadMore = useCallback(() => {
    if (hasMore) setPage((p) => p + 1);
  }, [hasMore]);

  const reset = useCallback(() => setPage(1), []);

  return { visible, hasMore, loadMore, reset, total, pageSize };
}
