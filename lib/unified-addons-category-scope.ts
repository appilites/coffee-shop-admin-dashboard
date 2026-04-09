/**
 * Which `menu_categories` rows get the unified Add-ons block when running
 * POST /api/setup/unify-addons-variations (default: no body.categoryIds).
 *
 * Includes:
 * - All subcategories under seed “Hot Beverages” + “Cold Beverages” parents
 * - Any category whose name matches the drink lines below (and products in their subtrees)
 * - Walking up the parent chain so leaf rows like “Loaded Tea – Berry” match “Loaded Tea”
 */

export const BEVERAGE_PARENT_IDS = ["cat-hot-beverages", "cat-cold-beverages"] as const

/** Fallback if DB has no categories table rows (see seed-categories + mock ids). */
export const FALLBACK_BEVERAGE_LEAF_IDS = [
  "cat-espresso",
  "cat-brewed-coffee",
  "cat-hot-tea",
  "cat-hot-chocolate",
  "cat-iced-coffee",
  "cat-cold-brew",
  "cat-smoothies",
  "cat-lemonade",
]

/** Explicit mock / legacy IDs from data/mock-data.ts — used when name match fails. */
export const EXTENDED_DRINK_CATEGORY_ID_ALLOWLIST = [
  "cat-meal-replacement",
  "cat-loaded-tea-berry",
  "cat-loaded-tea-orange",
  "cat-loaded-tea-lime",
  "cat-loaded-tea-tropical",
  "cat-beauty-berry",
  "cat-beauty-lime",
  "cat-beauty-tropical",
  "cat-beauty-orange",
  "cat-specialty-berry",
  "cat-specialty-lime",
  "cat-specialty-tropical",
  "cat-specialty-orange",
  "cat-kids-berry",
  "cat-kids-orange",
] as const

export type CategoryRow = {
  id: string
  name: string | null
  parent_id: string | null
}

/**
 * True if this category name belongs to the extended drink lines (Kids, Meal Replacement,
 * Specialty, Cold Drinks, Beauty, Loaded Tea) — case-insensitive, en/em dash tolerant.
 */
export function matchesExtendedDrinkLineName(name: string | null | undefined): boolean {
  if (!name || typeof name !== "string") return false
  const n = name
    .toLowerCase()
    .replace(/\u2013|\u2014/g, "-")
    .trim()

  if (n.includes("kids drink")) return true
  if (n.includes("meal replacement")) return true
  if (n.includes("specialty drink")) return true
  if (n.includes("beauty drink")) return true
  if (n.includes("loaded tea")) return true
  if (n === "cold drinks" || /\bcold drinks\b/.test(n) || /\bcold drink\b/.test(n)) return true

  return false
}

function parentIsSeedBeverageParent(parentId: string | null): boolean {
  if (!parentId) return false
  return (BEVERAGE_PARENT_IDS as readonly string[]).includes(parentId)
}

/**
 * Collect every category id that should receive unified add-ons.
 */
export function collectUnifiedAddonsCategoryIds(categories: CategoryRow[]): string[] {
  const byId = new Map<string, CategoryRow>()
  for (const c of categories) {
    byId.set(c.id, c)
  }

  const ids = new Set<string>()

  for (const c of categories) {
    if (parentIsSeedBeverageParent(c.parent_id)) {
      ids.add(c.id)
    }
    if ((BEVERAGE_PARENT_IDS as readonly string[]).includes(c.id)) {
      ids.add(c.id)
    }
  }

  const chainMatchesExtendedLine = (c: CategoryRow): boolean => {
    let cur: CategoryRow | undefined = c
    const seen = new Set<string>()
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id)
      if (matchesExtendedDrinkLineName(cur.name)) return true
      cur = cur.parent_id ? byId.get(cur.parent_id) : undefined
    }
    return false
  }

  for (const c of categories) {
    if (chainMatchesExtendedLine(c)) {
      ids.add(c.id)
    }
  }

  for (const id of EXTENDED_DRINK_CATEGORY_ID_ALLOWLIST) {
    if (byId.has(id)) ids.add(id)
  }

  return ids.size > 0 ? [...ids] : [...FALLBACK_BEVERAGE_LEAF_IDS]
}
