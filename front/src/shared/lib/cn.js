import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  extend: { theme: { radius: ['pill'], shadow: ['glow'] } },
})

export const cn = (...inputs) => twMerge(clsx(inputs))
