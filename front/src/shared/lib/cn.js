import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Joins class names and lets the last Tailwind class win (min-h-14 replaces min-h-11).
// It also knows our own radius and shadow tokens (index.css), so rounded-md replaces rounded-pill.
const twMerge = extendTailwindMerge({
  extend: { theme: { radius: ['pill'], shadow: ['glow'] } },
})

export const cn = (...inputs) => twMerge(clsx(inputs))
