import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Joins class names and lets the last Tailwind class win (min-h-14 replaces min-h-11).
export const cn = (...inputs) => twMerge(clsx(inputs))
