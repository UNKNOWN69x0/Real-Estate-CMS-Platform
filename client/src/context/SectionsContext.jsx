import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchSections } from '../api/public.js';
import { fallbackSections } from '../utils/fallbackContent.js';

const SectionsContext = createContext(null);

export function SectionsProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', byKey: {} });

  const load = useCallback((signal) => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    fetchSections(signal)
      .then((list) => setState({ status: 'ready', byKey: Object.fromEntries(list.map((s) => [s.key, s])) }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ status: 'error', byKey: {} });
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const value = useMemo(() => ({ ...state, retry: () => load() }), [state, load]);
  return <SectionsContext.Provider value={value}>{children}</SectionsContext.Provider>;
}

export function useSectionsStatus() {
  const ctx = useContext(SectionsContext);
  if (!ctx) throw new Error('useSectionsStatus must be used inside <SectionsProvider>');
  return ctx;
}

/**
 * One CMS section by key.
 *  - loading: section is null (render a skeleton)
 *  - API down: built-in fallback copy
 *  - loaded but not published: null (the section is hidden), except the navbar which always needs links
 */
export function useSection(key) {
  const { status, byKey } = useSectionsStatus();
  if (status === 'loading') return { section: null, loading: true };
  if (status === 'error') return { section: fallbackSections[key] ?? null, loading: false };
  return { section: byKey[key] ?? (key === 'navbar' ? fallbackSections.navbar : null), loading: false };
}
