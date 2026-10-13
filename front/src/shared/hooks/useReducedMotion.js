// Reads prefers-reduced-motion. Used to turn off parallax and long animations.
import { useMediaQuery } from './useMediaQuery.js'

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
