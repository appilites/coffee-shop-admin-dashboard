import type { SupabaseClient } from "@supabase/supabase-js"

type VariationRow = {
  title?: string
  type?: string
  required?: boolean
  options?: Array<{ label?: string; priceModifier?: number }>
  maxIncludedSelections?: number
  extraSelectionPrice?: number
}

/**
 * Keeps `customization_options` / `customization_choices` aligned with `menu_items.variations` JSON.
 * Run after admin product create/update. Requires columns from docs/sql/customization_options_pricing.sql.
 */
export async function syncVariationsToCustomizationTables(
  supabase: SupabaseClient,
  menuItemId: string,
  variations: unknown[] | null | undefined
): Promise<{ ok: boolean; error?: string }> {
  const list = Array.isArray(variations) ? variations : []

  const { error: delErr } = await supabase
    .from("customization_options")
    .delete()
    .eq("menu_item_id", menuItemId)

  if (delErr) {
    const msg = delErr.message || String(delErr)
    if (msg.includes("does not exist") || delErr.code === "42P01") {
      return { ok: true }
    }
    console.warn("syncVariations: delete customization_options failed:", delErr)
    return { ok: false, error: msg }
  }

  if (list.length === 0) return { ok: true }

  for (let i = 0; i < list.length; i++) {
    const v = list[i] as VariationRow
    const isCheckbox = v.type === "checkbox"
    const maxIn =
      isCheckbox &&
      typeof v.maxIncludedSelections === "number" &&
      Number.isFinite(v.maxIncludedSelections)
        ? Math.max(0, Math.floor(v.maxIncludedSelections))
        : null
    const extraPri =
      isCheckbox &&
      typeof v.extraSelectionPrice === "number" &&
      Number.isFinite(v.extraSelectionPrice) &&
      v.extraSelectionPrice > 0
        ? v.extraSelectionPrice
        : null

    const insertRow: Record<string, unknown> = {
      menu_item_id: menuItemId,
      option_name: String(v.title ?? "").trim() || "Option",
      option_type: v.type === "radio" ? "single" : "multiple",
      is_required: Boolean(v.required),
      display_order: i,
      max_included_selections: maxIn,
      extra_selection_price: extraPri,
    }

    const { data: optionRow, error: optErr } = await supabase
      .from("customization_options")
      .insert(insertRow)
      .select("id")
      .single()

    if (optErr) {
      console.warn("syncVariations: insert customization_options failed:", optErr)
      return { ok: false, error: optErr.message }
    }

    const optionId = optionRow?.id as string
    const opts = Array.isArray(v.options) ? v.options : []
    for (let j = 0; j < opts.length; j++) {
      const o = opts[j]
      const { error: chErr } = await supabase.from("customization_choices").insert({
        option_id: optionId,
        choice_name: String(o?.label ?? "").trim() || "Choice",
        price_modifier: Number(o?.priceModifier ?? 0),
        display_order: j,
        is_default: false,
      })
      if (chErr) {
        console.warn("syncVariations: insert customization_choices failed:", chErr)
        return { ok: false, error: chErr.message }
      }
    }
  }

  return { ok: true }
}
