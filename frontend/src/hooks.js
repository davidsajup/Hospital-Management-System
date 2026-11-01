import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

/** GET a path and track loading/error state. `reload()` refetches. */
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));

  const load = useCallback(() => {
    if (!path) return;
    setLoading(true);
    return api(path)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(() => {
    // Cancel stale responses if the path changes mid-flight.
    let cancelled = false;
    if (!path) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api(path)
      .then((d) => !cancelled && (setData(d), setError(null)))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { data, error, loading, reload: load, setData };
}

/**
 * Server-side paged + searchable list. `params` are extra filters (status, etc.);
 * changing them resets to page 1. Previous rows stay on screen while the next page loads.
 */
export function usePagedList(base, params = {}, pageSize = 10) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const filters = JSON.stringify(params);
  useEffect(() => setPage(1), [filters]);

  const qs = new URLSearchParams({ page, pageSize });
  if (term) qs.set('q', term);
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);

  const state = useApi(`${base}?${qs}`);
  return { state, page, setPage, q, setQ };
}

/** Formats YYYY-MM-DD / HH:MM from the API for display. */
export const fmtDate = (d) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};
