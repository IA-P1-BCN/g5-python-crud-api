// Pure: price computation. Rule D-01 is open: fixed price per player (BR-B4) for now.
export function computeTotalPrice({ pricePerPlayer, players }) {
  // Round to cents: 12.1 * 3 is 36.300000000000004 in JavaScript.
  return Math.round(pricePerPlayer * players * 100) / 100
}
