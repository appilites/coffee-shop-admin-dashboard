# Unified add-ons for drinks & shakes — database guide

**Full category list (Kids, Meal Replacement, Specialty, Cold, Beauty, Loaded Tea + café drinks):** see **`docs/UNIFIED_ADDONS_ALL_DRINK_CATEGORIES.md`**.

## Problem

Add-ons were **different per product type** (e.g. coffee-style list on smoothies, shake-style list on lattes) because each `menu_items` row had its own `variations` JSON, and those blocks were edited or seeded separately.

There is **no separate “shake add-ons” table** in the schema: everything lives in **`menu_items.variations`** (`jsonb`). The fix is to store **the same “Add-ons” checkbox variation** (one combined list) on every drink and shake product you want to offer the full combo on.

---

## Schema (what changes, if anything)

| Object | Change required? |
|--------|------------------|
| `menu_items.variations` | **Yes — data only:** replace / merge the add-ons block so it matches your single master list. |
| `customization_options` / `customization_choices` | **Optional sync:** Admin API `PUT /api/products/[id]` and bulk setup re-sync these from JSON when columns exist. Run pricing column migration if you use relational customizations (`docs/sql/customization_options_pricing.sql`). |
| New tables / columns | **Not required** for “one list everywhere.” |

---

## Canonical template in this repo

Source of truth for the **default combined list**:

- **`lib/unified-drink-shake-addons.ts`** — exports `UNIFIED_ADDONS_VARIATION` (coffee + shake–style options in one checkbox group).

Edit that file if you want the default bulk apply to change, **or** edit products in **Admin → Products → Variations** after apply.

---

## Option A — Bulk apply (recommended)

**Default (no `categoryIds` in body):** the API loads `menu_categories` and selects **every subcategory** whose parent is **`cat-hot-beverages`** or **`cat-cold-beverages`**, plus products filed directly under those parents. That includes **Espresso, Brewed Coffee, Hot Tea, Hot Chocolate, Iced Coffee, Cold Brew, Smoothies & Shakes, Lemonade & Juices** — so **drinks and shakes all get the same add-ons** in one run. Custom drink categories you add under Hot/Cold are included automatically.

`GET /api/setup/unify-addons-variations` shows `resolvedCategoryIds` for your database.

1. **Dry run** (no writes):

   ```http
   POST /api/setup/unify-addons-variations
   Content-Type: application/json

   { "dryRun": true }
   ```

2. Review the JSON response `preview` (product names, variation counts) and `categoryIds`.

3. **Apply**:

   ```http
   POST /api/setup/unify-addons-variations
   Content-Type: application/json

   { "dryRun": false }
   ```

4. **Custom categories only** (override auto list):

   ```json
   {
     "dryRun": false,
     "categoryIds": ["cat-smoothies", "cat-iced-coffee"]
   }
   ```

**Behaviour:** Any existing variation whose title looks like “Add-ons” / “Add-on…” or whose `id` matches the strip rules is **removed**, then **one** new add-ons block (`addons-unified-v2`) is **appended** (usually after size/milk/etc.). The **same** block is used across Kids Drinks, Meal Replacement, Specialty, Cold, Beauty, Loaded Tea, and café lines — see `docs/UNIFIED_ADDONS_ALL_DRINK_CATEGORIES.md` for the option table.

**Requirements:** `SUPABASE_SERVICE_ROLE_KEY` (or secret key) on the server so the route can update `menu_items`.

---

## Option B — Supabase SQL (advanced)

Pure SQL cannot easily “merge JSON” for every row without a stored procedure. Prefer **Option A** or **Option C**.

If you must patch one product by hand in SQL:

```sql
-- Example only: replace entire variations for one menu_items.id — backup first!
-- update menu_items set variations = '[...]'::jsonb where id = '...';
```

Always **backup** `menu_items` before mass updates.

---

## Option C — Admin UI (manual)

For each drink/shake product:

1. Open **Products → Edit**.
2. Under **Variations**, remove the old **Add-ons** group.
3. Add a **Checkbox** variation titled **Add-ons** and enter **all** options (coffee + shake) with correct `priceModifier` values.
4. Save (writes `menu_items.variations` and triggers `customization_options` sync when configured).

---

## After database update

1. **Shop / API:** `GET /api/products` and `GET /api/products/[id]` already return `variations` from JSON — customers will see the new list without API code changes.
2. **Orders:** Existing orders keep their saved `customizations`; only new carts use the new option IDs.
3. **IDs:** Keep option `id` strings stable (`addon-extra-shot`, etc.) so cart keys and analytics stay consistent. If you rename IDs, old carts/checkout links may break.

---

## Related files

| File | Purpose |
|------|---------|
| `lib/unified-drink-shake-addons.ts` | Master add-ons variation + strip/merge helpers |
| `app/api/setup/unify-addons-variations/route.ts` | Bulk POST |
| `docs/UNIFIED_ADDONS_SHOP_FRONTEND.md` | Customer app UI (must not swap lists by category) |
