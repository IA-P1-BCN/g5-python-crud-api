// Pure formatters for prices and dates. No React.
const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

export function formatPrice(amount) {
  return euro.format(amount)
}
