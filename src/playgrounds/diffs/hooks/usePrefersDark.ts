import { useCallback, useSyncExternalStore } from 'react';

const QUERY = '(prefers-color-scheme: dark)';

/**
 * Canvas text needs an explicit colour, so it cannot ride on Tailwind's `dark:`
 * variant. This project is on Tailwind v4 with no `dark` class variant
 * configured, so `dark:` resolves against the same media query used here.
 */
export function usePrefersDark(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const list = window.matchMedia(QUERY);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}
