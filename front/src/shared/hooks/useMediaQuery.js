import { useCallback, useSyncExternalStore } from 'react'

// True while the CSS media query matches; re-renders when the browser reports a change.
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const mql = window.matchMedia?.(query)
      mql?.addEventListener('change', onChange)
      return () => mql?.removeEventListener('change', onChange)
    },
    [query],
  )
  const getSnapshot = () => window.matchMedia?.(query).matches ?? false

  return useSyncExternalStore(subscribe, getSnapshot)
}
