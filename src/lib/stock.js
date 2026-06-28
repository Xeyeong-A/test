export function canFulfillOrder(stock, quantity) {
  const safeStock = Number(stock ?? 0)
  const safeQuantity = Number(quantity ?? 0)

  return Number.isFinite(safeStock) && Number.isFinite(safeQuantity) && safeQuantity > 0 && safeStock >= safeQuantity
}

export function getUpdatedStock(stock, quantity) {
  if (!canFulfillOrder(stock, quantity)) {
    return null
  }

  return Number(stock ?? 0) - Number(quantity ?? 0)
}
