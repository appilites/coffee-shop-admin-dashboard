# Unified Add-ons — Kids, Meal Replacement, Specialty, Cold, Beauty, Loaded Tea, + all café drinks

This document ties together **database**, **admin dashboard**, **coffee shop**, and **production deploy** so every product in your drink lines uses **one** combined Add-ons list.

---

## What you get

| Area | Behaviour |
|------|-----------|
| **Supabase (`menu_items.variations`)** | One checkbox variation `addons-unified-v2` with the canonical list below (`lib/unified-drink-shake-addons.ts`). |
| **Admin dashboard** | Products → Edit → Variations show the same Add-ons after bulk apply or save. |
| **Coffee shop** | `GET /api/products` / product by id returns `variations`; render from API — no separate shake vs drink lists. |
| **Live (after git push)** | Code ships with the resolver + template; you **run the setup POST once per environment** (see below). |

---

## Categories covered (automatic)

When you call **`POST /api/setup/unify-addons-variations`** **without** `categoryIds`, the server loads `menu_categories` and includes **all** `category_id` values that match:

1. **Seed café tree** — subcategories of **`cat-hot-beverages`** and **`cat-cold-beverages`** (espresso, iced coffee, smoothies, etc.).
2. **Name rules** (case-insensitive; en-dash `–` is OK) — any category whose **name** matches, **or whose parent chain** matches:
   - **Kids Drinks** (e.g. `Kids Drinks – Berry`)
   - **Meal Replacement** (e.g. `Meal Replacement Shakes`)
   - **Specialty Drinks**
   - **Cold Drinks**
   - **Beauty Drinks**
   - **Loaded Tea** (e.g. `Loaded Tea – Orange`)

3. **ID allowlist** — if your DB uses the IDs from `data/mock-data.ts` (`cat-meal-replacement`, `cat-loaded-tea-berry`, `cat-kids-berry`, …), those are merged in when present (`lib/unified-addons-category-scope.ts`).

**Products** in those categories are updated so **`variations` JSON** contains the unified Add-ons block (old “Add-ons” blocks are removed first).

---

## Canonical Add-ons list (same for all covered products)

Variation id: **`addons-unified-v2`** — running bulk apply **removes** any previous “Add-ons” block (including `addons-unified-v1`) and **appends** this list.

Source: **`lib/unified-drink-shake-addons.ts`** (`UNIFIED_ADDONS_VARIATION`).

| Option | Price |
|--------|------:|
| Extra Lift off | +$2.50 |
| Extra NRG | +$1.00 |
| Extra Tea | +$1.00 |
| Extra Protein | +$2.00 |
| Defense Tablet | +$1.50 |
| Immunity Booster | +$1.50 |
| Probiotic | +$1.00 |
| Hibiscus Tea | +$1.00 |
| Green Tea | +$1.00 |
| Whip Cream | +$0.50 |
| Prolessa | +$5.00 |
| Whipped Cream | +$0.50 |
| Caramel Drizzle | +$0.50 |
| Vanilla Syrup | +$0.50 |
| Honey | +$0.50 |

Edit **prices/labels** in that file (then re-run bulk apply) **or** per product in **Admin → Products**.

---

## Steps: local or staging

1. **Migrations you may already have**  
   - `menu_items.variations` JSONB  
   - Optional: `docs/sql/customization_options_pricing.sql` if you sync relational customizations  

2. **Preview** (no writes):

   ```http
   POST /api/setup/unify-addons-variations
   Content-Type: application/json

   { "dryRun": true }
   ```

   Check `resolvedCategoryIds`, `productCount`, and `preview`.

3. **Apply**:

   ```http
   POST /api/setup/unify-addons-variations
   Content-Type: application/json

   { "dryRun": false }
   ```

4. **Inspect**  
   - Supabase → `menu_items` → pick a row → `variations` should include `id: "addons-unified-v2"`.  
   - Admin → same product → Variations UI.

5. **Shop**  
   Hard-refresh or revalidate cache; cart should use `product.variations` only (`docs/UNIFIED_ADDONS_SHOP_FRONTEND.md`).

---

## Steps: production (after `git push`)

1. Deploy the admin dashboard (this repo) to your host (Vercel, etc.).  
2. Set **`SUPABASE_SERVICE_ROLE_KEY`** (or `SUPABASE_SECRET_KEY`) on the server — required for the setup route to update `menu_items`.  
3. Run the same **`dryRun` then `dryRun: false`** POST against your **production** base URL, e.g.:

   `https://YOUR-ADMIN-DOMAIN/api/setup/unify-addons-variations`

4. Optionally **restrict** to explicit IDs if auto-resolution picks too much:

   ```json
   { "dryRun": false, "categoryIds": ["cat-kids-berry", "cat-loaded-tea-berry"] }
   ```

5. Re-run **coffee shop** deploy or clear ISR cache so customers see new JSON.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Category not updated | Category **name** must match the patterns above, or use **`categoryIds`** explicitly. |
| Wrong products touched | Use `dryRun: true` first; narrow `categoryIds`. |
| Dashboard still old | Reload product; confirm PUT saved `variations` in Supabase. |
| Shop still old | Shop must read **`variations` from API/Supabase**, not hardcoded lists. |
| `customization_options` empty | Run pricing column migration; sync runs after unify; check logs. |

---

## Related files

| File | Role |
|------|------|
| `lib/unified-drink-shake-addons.ts` | Master Add-ons JSON |
| `lib/unified-addons-category-scope.ts` | Category resolution + ID allowlist |
| `app/api/setup/unify-addons-variations/route.ts` | Bulk POST + GET (preview `resolvedCategoryIds`) |
| `docs/SHOP_ADDONS_INTEGRATION.md` | **Copy into shop repo** — env, types, cart, API |
| `docs/sql/apply_unified_addons_to_menu_items.sql` | **Supabase SQL** — apply add-ons without Node |
| `docs/UNIFIED_ADDONS_DATABASE.md` | DB-focused notes |
| `docs/UNIFIED_ADDONS_SHOP_FRONTEND.md` | Customer app |
| `docs/VARIATIONS_INTEGRATION.md` | Full variation + pricing contract |
