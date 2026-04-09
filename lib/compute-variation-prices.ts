/**
 * Price bounds from menu_items.variations JSON (admin + public product APIs).
 * Checkbox groups may define maxIncludedSelections + extraSelectionPrice so
 * each selection beyond the included count adds a flat surcharge (e.g. extra fruits).
 */

export function computePriceData(basePrice: number, variations: unknown[] | null | undefined) {
  const safeVariations = Array.isArray(variations) ? variations : []
  let minPrice = basePrice
  let maxPrice = basePrice

  for (const variation of safeVariations as Array<Record<string, unknown>>) {
    const opts = Array.isArray(variation.options) ? variation.options : []
    if (variation.type === "radio") {
      const prices = opts.map((o: { priceModifier?: unknown }) => Number((o as { priceModifier?: unknown }).priceModifier ?? 0))
      if (prices.length) {
        minPrice += Math.min(...prices)
        maxPrice += Math.max(...prices)
      }
    } else {
      const sum = opts.reduce(
        (acc: number, o: { priceModifier?: unknown }) => acc + Number((o as { priceModifier?: unknown }).priceModifier ?? 0),
        0
      )
      maxPrice += sum

      const maxIncluded = variation.maxIncludedSelections
      const maxIncludedNum =
        typeof maxIncluded === "number" && Number.isFinite(maxIncluded) && maxIncluded >= 0
          ? Math.floor(maxIncluded)
          : undefined
      const extra = Number(variation.extraSelectionPrice ?? 0)
      if (maxIncludedNum !== undefined && extra > 0 && opts.length > maxIncludedNum) {
        maxPrice += extra * (opts.length - maxIncludedNum)
      }
    }
  }

  return {
    calculatedTotalPrice: maxPrice,
    priceRange: { minPrice, maxPrice },
  }
}
