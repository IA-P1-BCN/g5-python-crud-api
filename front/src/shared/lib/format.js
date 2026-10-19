const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

export function formatPrice(amount) {
  return euro.format(amount)
}

const dateTime = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' })

export function formatDateTime(iso) {
  return dateTime.format(new Date(iso))
}
