/**
 * Customer-facing line price from base + chosen variation options.
 * Use in the coffee shop for cart / product page totals.
 *
 * Checkbox: preserve `selectedOptions[variationId]` as an ordered string[] (first picked = index 0).
 * Selections at index >= maxIncludedSelections each add extraSelectionPrice on top of that option’s modifier.
 */

export type VariationOptionForPricing = { id: string; priceModifier?: number }

export type VariationForPricing = {
  id: string
  type: string
  options: VariationOptionForPricing[]
  maxIncludedSelections?: number
  extraSelectionPrice?: number
}

export function calculateLineTotalFromSelections(
  basePrice: number,
  variations: VariationForPricing[],
  selectedOptions: Record<string, string | string[]>
): number {
  let total = basePrice

  for (const variation of variations) {
    const sel = selectedOptions[variation.id]
    if (sel === undefined || sel === null) continue

    if (variation.type === "radio") {
      const id = sel as string
      const opt = variation.options.find((o) => o.id === id)
      if (opt) total += Number(opt.priceModifier ?? 0)
    } else {
      const chosenIds = Array.isArray(sel) ? sel : [String(sel)]
      const maxIncluded =
        typeof variation.maxIncludedSelections === "number" &&
        Number.isFinite(variation.maxIncludedSelections)
          ? Math.max(0, Math.floor(variation.maxIncludedSelections))
          : undefined
      const extra = Number(variation.extraSelectionPrice ?? 0)

      chosenIds.forEach((optId, index) => {
        const opt = variation.options.find((o) => o.id === optId)
        if (!opt) return
        total += Number(opt.priceModifier ?? 0)
        if (maxIncluded !== undefined && extra > 0 && index >= maxIncluded) {
          total += extra
        }
      })
    }
  }

  return Math.round(total * 100) / 100
}

/** Extra surcharge only (for UI: “+ $1.50 extra fruit”) from current checkbox order. */
export function extraSurchargeForCheckboxVariation(
  variation: VariationForPricing,
  chosenOrderedIds: string[]
): number {
  if (variation.type === "radio") return 0
  const maxIncluded =
    typeof variation.maxIncludedSelections === "number" &&
    Number.isFinite(variation.maxIncludedSelections)
      ? Math.max(0, Math.floor(variation.maxIncludedSelections))
      : undefined
  const extra = Number(variation.extraSelectionPrice ?? 0)
  if (maxIncluded === undefined || extra <= 0) return 0
  const beyond = Math.max(0, chosenOrderedIds.length - maxIncluded)
  return Math.round(beyond * extra * 100) / 100
}
