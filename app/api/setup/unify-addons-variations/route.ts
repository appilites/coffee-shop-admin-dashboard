import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseAdminClient } from "@/lib/supabase-server"
import {
  stripExistingAddonsVariations,
  withUnifiedAddonsVariation,
} from "@/lib/unified-drink-shake-addons"
import { syncVariationsToCustomizationTables } from "@/lib/sync-variations-to-customization-tables"
import {
  BEVERAGE_PARENT_IDS,
  collectUnifiedAddonsCategoryIds,
  EXTENDED_DRINK_CATEGORY_ID_ALLOWLIST,
  FALLBACK_BEVERAGE_LEAF_IDS,
  matchesExtendedDrinkLineName,
  type CategoryRow,
} from "@/lib/unified-addons-category-scope"

/**
 * Bulk-replace “Add-ons” with one shared list (lib/unified-drink-shake-addons.ts).
 *
 * POST body (optional JSON):
 *   { "categoryIds": [...], "dryRun": true }
 *   { "dryRun": true } — auto-resolve categories (see docs/UNIFIED_ADDONS_ALL_DRINK_CATEGORIES.md)
 */
export const DEFAULT_BEVERAGE_CATEGORY_IDS = FALLBACK_BEVERAGE_LEAF_IDS

async function resolveAllUnifiedAddonsCategoryIds(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data: cats, error } = await supabase
    .from("menu_categories")
    .select("id, name, parent_id")

  if (error || !cats?.length) {
    return [
      ...new Set([
        ...FALLBACK_BEVERAGE_LEAF_IDS,
        ...(EXTENDED_DRINK_CATEGORY_ID_ALLOWLIST as readonly string[]),
      ]),
    ]
  }

  return collectUnifiedAddonsCategoryIds(cats as CategoryRow[])
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const supabase = getSupabaseAdminClient()

    let categoryIds: string[]
    if (Array.isArray(body.categoryIds) && (body.categoryIds as string[]).length > 0) {
      categoryIds = body.categoryIds as string[]
    } else {
      categoryIds = await resolveAllUnifiedAddonsCategoryIds(supabase)
    }

    const dryRun = Boolean(body.dryRun)

    if (categoryIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "categoryIds must be a non-empty array when provided" },
        { status: 400 }
      )
    }

    const { data: products, error } = await supabase
      .from("menu_items")
      .select("id, name, category_id, variations")
      .in("category_id", categoryIds)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const rows = products || []
    const preview: Array<{
      id: string
      name: string
      category_id: string | null
      previousAddonsStripped: boolean
      addonsBlocksRemoved: number
      variationCountBefore: number
      variationCountAfter: number
    }> = []

    const updated: string[] = []

    for (const p of rows) {
      const before = Array.isArray(p.variations) ? p.variations : []
      const afterStrip = stripExistingAddonsVariations(before)
      const addonsBlocksRemoved = before.length - afterStrip.length
      const after = withUnifiedAddonsVariation(before) as unknown[]

      preview.push({
        id: p.id,
        name: p.name,
        category_id: p.category_id,
        previousAddonsStripped: addonsBlocksRemoved > 0,
        addonsBlocksRemoved,
        variationCountBefore: before.length,
        variationCountAfter: after.length,
      })

      if (dryRun) continue

      const { error: upErr } = await supabase
        .from("menu_items")
        .update({
          variations: after,
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id)

      if (upErr) {
        console.error("unify-addons update failed:", p.id, upErr)
        continue
      }

      const sync = await syncVariationsToCustomizationTables(supabase, p.id, after)
      if (!sync.ok) {
        console.warn("unify-addons sync customization_options:", p.id, sync.error)
      }
      updated.push(p.id)
    }

    return NextResponse.json({
      success: true,
      dryRun,
      categoryIds,
      beverageParentsUsed: BEVERAGE_PARENT_IDS,
      namePatterns: [
        "Kids Drinks",
        "Meal Replacement",
        "Specialty Drinks",
        "Cold Drinks",
        "Beauty Drinks",
        "Loaded Tea",
        "+ Hot/Cold beverage subcategories (cat-hot-beverages / cat-cold-beverages)",
      ],
      extendedIdAllowlist: EXTENDED_DRINK_CATEGORY_ID_ALLOWLIST,
      productCount: rows.length,
      updatedIds: dryRun ? [] : updated,
      preview:
        preview.length <= 80 ? preview : preview.slice(0, 80),
      message: dryRun
        ? "No writes performed. Set dryRun false to apply."
        : `Updated ${updated.length} product(s).`,
    })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    const resolved = await resolveAllUnifiedAddonsCategoryIds(supabase)
    return NextResponse.json({
      description:
        "POST { dryRun: true } then { dryRun: false } — one Add-ons list for coffee shop + Kids / Meal Replacement / Specialty / Cold / Beauty / Loaded Tea lines (see docs/UNIFIED_ADDONS_ALL_DRINK_CATEGORIES.md).",
      beverageParentCategories: BEVERAGE_PARENT_IDS,
      resolvedCategoryIds: resolved,
      resolvedCount: resolved.length,
      fallbackIfDbEmpty: [
        ...new Set([
          ...FALLBACK_BEVERAGE_LEAF_IDS,
          ...(EXTENDED_DRINK_CATEGORY_ID_ALLOWLIST as readonly string[]),
        ]),
      ],
      nameMatchExamples: [
        matchesExtendedDrinkLineName("Loaded Tea – Berry"),
        matchesExtendedDrinkLineName("Kids Drinks – Orange"),
      ],
    })
  } catch {
    return NextResponse.json({
      description: "POST optional { categoryIds, dryRun } — unified add-ons from lib/unified-drink-shake-addons.ts",
      beverageParentCategories: BEVERAGE_PARENT_IDS,
      fallbackCategoryIds: DEFAULT_BEVERAGE_CATEGORY_IDS,
    })
  }
}
