export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
export const smoothstep = (k) => k * k * (3 - 2 * k)
