# Coffee shop frontend — unified add-ons

**Category coverage (Kids, Loaded Tea, Beauty, etc.):** `docs/UNIFIED_ADDONS_ALL_DRINK_CATEGORIES.md`.

Use this in the **customer-facing app** (the repo that renders the menu and cart). The admin dashboard only stores data; wrong add-ons on the wrong products almost always come from **shop logic**, not from Supabase alone.

---

## Root cause on the frontend

Typical bug pattern:

```ts
// Bad — two different lists by category or product name
const addons = isShake ? SHAKE_ADDONS : DRINK_ADDONS
```

or loading **hardcoded** add-ons instead of **`product.variations`** from the API.

After the database is fixed, the API already returns **one** “Add-ons” block per product. The shop must **render what the API sends**, not swap lists.

---

## What to do

### 1. Single source of truth: API

- Fetch product with `GET /api/products/[id]` or your Supabase `menu_items` row.
- Use **`product.variations`** (array) only.
- Find the variation where `title` is “Add-ons” (or `type === "checkbox"` and you match by `id` e.g. `addons-unified-v2`).
- Render **all** `options` with `label` + `priceModifier`.

### 2. Remove hardcoded add-on arrays

Search the shop codebase for:

- `shake` / `smoothie` / `drink` branching next to **addon**, **extra shot**, **syrup**, etc.
- Duplicate constants like `DRINK_ADDONS`, `SHAKE_ADDONS`, `COFFEE_EXTRAS`

Replace with: **map over `variation.options`** from the product payload.

### 3. Selection state

- **Radio** variations: `Record<variationId, optionId>`.
- **Checkbox** (Add-ons): `Record<variationId, optionId[]>` — preserve **array order** if you use extra-pricing rules (`maxIncludedSelections` / `extraSelectionPrice`); see `docs/VARIATIONS_INTEGRATION.md`.

### 4. Price line item

Use the same pricing helper as the admin docs describe, e.g. **`calculateLineTotalFromSelections`** from `lib/calculate-variation-selection-price.ts` (copy into the shop or share a package):

- Pass `base_price` + full `variations` + customer’s `selectedOptions`.
- Do **not** add a second “shake fee” in the UI if those fees are already `priceModifier` on an option.

### 5. Menu cards / category pages

- Category pages should **not** attach a different add-on definition per category.
- Optional: hide certain options by **dietary** rules only if product explicitly includes flags — default is **show all options from API** for drinks/shakes.

---

## Checklist before release

- [ ] No `if (category === 'Smoothies')` (or similar) around add-on rendering.
- [ ] Add-ons UI is driven only by `product.variations`.
- [ ] Cart line price matches server-side recalculation (never trust client-only totals for payment).
- [ ] After DB bulk update, hard-refresh / revalidate ISR cache so old JSON isn’t cached forever.

---

## If add-ons still look “swapped”

1. Confirm **`menu_items.variations`** for a mislabeled product in Supabase (JSON editor) — if wrong there, fix DB first (`docs/UNIFIED_ADDONS_DATABASE.md`).
2. If JSON is correct but UI wrong, search the shop for **hardcoded** add-ons or **wrong product id** in `fetch` (e.g. always loading the same demo product).

---

## Related

- `docs/VARIATIONS_INTEGRATION.md` — full variation JSON, price rules, order payload.
- `docs/UNIFIED_ADDONS_DATABASE.md` — bulk apply + Supabase notes.
