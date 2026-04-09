# Shop app — unified product Add-ons (copy into your coffee shop repo)

Drop this file into your **customer-facing** Next.js/React repo (e.g. `docs/SHOP_ADDONS_INTEGRATION.md`). Admin stores add-ons on each product as JSON in Supabase `menu_items.variations`.

---

## 1. Data source

| Source | Use |
|--------|-----|
| **Supabase** | `menu_items.variations` (JSON array), `menu_items.base_price` |
| **Admin API** (optional) | `GET https://YOUR-ADMIN/api/products`, `GET /api/products/:id` — same JSON |

Products in Kids Drinks, Meal Replacement, Specialty, Cold, Beauty, Loaded Tea (and café lines) should include one checkbox variation:

- **`id`:** `addons-unified-v2`
- **`title`:** `Add-ons`
- **`type`:** `checkbox`
- **`options`:** array of `{ id, label, priceModifier }`

Do **not** hardcode this list in the shop if you can avoid it — read it from **`product.variations`** so DB + admin + shop stay in sync.

---

## 2. Environment

```env
# Same Supabase project as admin (or public API URL)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Optional: read products from deployed admin
NEXT_PUBLIC_ADMIN_API_URL=https://your-admin-domain.com
```

---

## 3. TypeScript (optional)

```ts
export type VariationOption = { id: string; label: string; priceModifier: number }

export type ProductVariation = {
  id: string
  title: string
  type: "radio" | "checkbox"
  required?: boolean
  options: VariationOption[]
}

// Find Add-ons block
function getAddonsVariation(variations: ProductVariation[] | null | undefined) {
  return variations?.find(
    (v) =>
      v.type === "checkbox" &&
      (v.title.toLowerCase().includes("add-on") || v.id === "addons-unified-v2")
  )
}
```

---

## 4. UI rules

1. Loop **`product.variations`** in order (size, milk, then add-ons, etc.).
2. For **`type === "checkbox"`**, keep selected option IDs as **`string[]`** in **tap order** if you use extra-fee rules later.
3. Show `+ $${option.priceModifier.toFixed(2)}` when `priceModifier > 0`.

---

## 5. Line total (cart)

Sum:

- `base_price`
- Each radio: chosen option `priceModifier`
- Each checkbox: each chosen option’s `priceModifier`

If you need a shared helper, copy **`calculateLineTotalFromSelections`** from the admin repo:

`admin-dashboard/lib/calculate-variation-selection-price.ts`

---

## 6. Order payload

Send the same shape the admin expects in `order_items.customizations`, e.g.:

```json
{
  "var-xxx": "opt-yyy",
  "addons-unified-v2": ["addon-extra-nrg", "addon-honey"]
}
```

Keys = variation `id`, values = option id or `string[]` for checkboxes.

---

## 7. After admin changes add-ons

- Invalidate **ISR / cache** for menu routes.
- Old orders are unchanged; new checkouts use new option ids.

---

## 8. SQL / DB apply (without Node)

If you prefer **Supabase SQL Editor** instead of `POST /api/setup/unify-addons-variations`, use:

**`docs/sql/apply_unified_addons_to_menu_items.sql`** (in admin-dashboard repo)

Always **backup** `menu_items` first.

---

## Related (admin repo)

| Doc / file | Purpose |
|------------|---------|
| `docs/UNIFIED_ADDONS_ALL_DRINK_CATEGORIES.md` | Full category + deploy checklist |
| `lib/unified-drink-shake-addons.ts` | Canonical option list & prices |
| `docs/VARIATIONS_INTEGRATION.md` | Variation JSON contract |
