/**
 * Single “Add-ons” checkbox — same for Kids Drinks, Meal Replacement Shakes, Specialty, Cold,
 * Beauty, Loaded Tea, + café drink lines. Bulk apply: POST /api/setup/unify-addons-variations
 * (old add-ons blocks are stripped; this list is appended).
 *
 * Edit labels/prices here or per product in Admin after apply.
 */

export const UNIFIED_ADDONS_VARIATION_ID = "addons-unified-v2"

/** Canonical list for DB + dashboard + shop (replace any prior addons-unified-v1). */
export const UNIFIED_ADDONS_VARIATION = {
  id: UNIFIED_ADDONS_VARIATION_ID,
  title: "Add-ons",
  type: "checkbox" as const,
  required: false,
  options: [
    { id: "addon-extra-lift-off", label: "Extra Lift off", priceModifier: 2.5 },
    { id: "addon-extra-nrg", label: "Extra NRG", priceModifier: 1.0 },
    { id: "addon-extra-tea", label: "Extra Tea", priceModifier: 1.0 },
    { id: "addon-extra-protein", label: "Extra Protein", priceModifier: 2.0 },
    { id: "addon-defense-tablet", label: "Defense Tablet", priceModifier: 1.5 },
    { id: "addon-immunity-booster", label: "Immunity Booster", priceModifier: 1.5 },
    { id: "addon-probiotic", label: "Probiotic", priceModifier: 1.0 },
    { id: "addon-hibiscus-tea", label: "Hibiscus Tea", priceModifier: 1.0 },
    { id: "addon-green-tea", label: "Green Tea", priceModifier: 1.0 },
    { id: "addon-whip-cream", label: "Whip Cream", priceModifier: 0.5 },
    { id: "addon-prolessa", label: "Prolessa", priceModifier: 5.0 },
    { id: "addon-whipped-cream", label: "Whipped Cream", priceModifier: 0.5 },
    { id: "addon-caramel-drizzle", label: "Caramel Drizzle", priceModifier: 0.5 },
    { id: "addon-vanilla-syrup", label: "Vanilla Syrup", priceModifier: 0.5 },
    { id: "addon-honey", label: "Honey", priceModifier: 0.5 },
  ],
}

/** Remove any existing add-ons–style variation so we don’t duplicate. */
export function stripExistingAddonsVariations(
  variations: unknown[] | null | undefined
): unknown[] {
  const list = Array.isArray(variations) ? variations : []
  return list.filter((v) => {
    const row = v as { title?: string; id?: string }
    const title = (row.title ?? "").toLowerCase()
    const id = (row.id ?? "").toLowerCase()
    if (title.includes("add-on") || title === "addons" || title.includes("add on")) return false
    if (id.includes("addon") && (id.includes("variation") || id === "addons-variation")) return false
    if (id === "addons-variation" || id.startsWith("addons-")) return false
    return true
  })
}

export function withUnifiedAddonsVariation(
  variations: unknown[] | null | undefined
): unknown[] {
  const base = stripExistingAddonsVariations(variations)
  return [...base, { ...UNIFIED_ADDONS_VARIATION }]
}
