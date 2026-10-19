import { useMediaQuery } from './useMediaQuery.js'

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
