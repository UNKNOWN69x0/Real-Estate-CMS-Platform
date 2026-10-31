import { useCallback, useEffect, useState } from 'react';
import { fetchCollection } from '../api/public.js';

// Loads one published collection ('gallery', 'amenities', 'floor-plans')
export function useCollection(name) {
  const [state, setState] = useState({ status: 'loading', items: [] });

  const load = useCallback(
    (signal) => {
      setState((prev) => ({ ...prev, status: 'loading' }));
      fetchCollection(name, signal)
        .then((items) => setState({ status: 'ready', items }))
        .catch((err) => {
          if (err.name !== 'AbortError') setState({ status: 'error', items: [] });
        });
    },
    [name],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { ...state, retry: () => load() };
}
