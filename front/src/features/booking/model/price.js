export function computeTotalPrice({ pricePerPlayer, players }) {
  return Math.round(pricePerPlayer * players * 100) / 100
}
