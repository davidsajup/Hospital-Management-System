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

/** Formats YYYY-MM-DD / HH:MM from the API for display. */
export const fmtDate = (d) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};
