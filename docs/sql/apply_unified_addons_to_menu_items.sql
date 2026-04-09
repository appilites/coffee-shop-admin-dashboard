-- =============================================================================
-- Apply unified Add-ons (addons-unified-v2) to menu_items.variations
-- PostgreSQL / Supabase — run in SQL Editor after BACKUP.
--
-- What it does:
--   1) Strips any existing "Add-ons" variation (same rules as admin strip).
--   2) Appends the canonical addons-unified-v2 JSON object.
--
-- Safer alternative (recommended): Admin POST /api/setup/unify-addons-variations
--   { "dryRun": true } then { "dryRun": false }
--
-- After run: optional DROP FUNCTION public.strip_addons_from_variations(jsonb);
-- =============================================================================

CREATE OR REPLACE FUNCTION public.strip_addons_from_variations(arr jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(e ORDER BY n)
      FROM jsonb_array_elements(COALESCE(arr, '[]'::jsonb)) WITH ORDINALITY AS t(e, n)
      WHERE NOT (
        lower(COALESCE(e->>'title', '')) LIKE '%add-on%'
        OR lower(trim(COALESCE(e->>'title', ''))) = 'addons'
        OR lower(COALESCE(e->>'title', '')) LIKE '%add on%'
        OR (
          lower(COALESCE(e->>'id', '')) LIKE '%addon%'
          AND lower(COALESCE(e->>'id', '')) LIKE '%variation%'
        )
        OR (e->>'id') = 'addons-variation'
        OR (e->>'id') LIKE 'addons-%'
      )
    ),
    '[]'::jsonb
  );
$$;

-- Canonical block — keep in sync with lib/unified-drink-shake-addons.ts
DO $$
DECLARE
  v_addon jsonb := '{
    "id": "addons-unified-v2",
    "title": "Add-ons",
    "type": "checkbox",
    "required": false,
    "options": [
      {"id": "addon-extra-lift-off", "label": "Extra Lift off", "priceModifier": 2.5},
      {"id": "addon-extra-nrg", "label": "Extra NRG", "priceModifier": 1.0},
      {"id": "addon-extra-tea", "label": "Extra Tea", "priceModifier": 1.0},
      {"id": "addon-extra-protein", "label": "Extra Protein", "priceModifier": 2.0},
      {"id": "addon-defense-tablet", "label": "Defense Tablet", "priceModifier": 1.5},
      {"id": "addon-immunity-booster", "label": "Immunity Booster", "priceModifier": 1.5},
      {"id": "addon-probiotic", "label": "Probiotic", "priceModifier": 1.0},
      {"id": "addon-hibiscus-tea", "label": "Hibiscus Tea", "priceModifier": 1.0},
      {"id": "addon-green-tea", "label": "Green Tea", "priceModifier": 1.0},
      {"id": "addon-whip-cream", "label": "Whip Cream", "priceModifier": 0.5},
      {"id": "addon-prolessa", "label": "Prolessa", "priceModifier": 5.0},
      {"id": "addon-whipped-cream", "label": "Whipped Cream", "priceModifier": 0.5},
      {"id": "addon-caramel-drizzle", "label": "Caramel Drizzle", "priceModifier": 0.5},
      {"id": "addon-vanilla-syrup", "label": "Vanilla Syrup", "priceModifier": 0.5},
      {"id": "addon-honey", "label": "Honey", "priceModifier": 0.5}
    ]
  }'::jsonb;
BEGIN
  UPDATE public.menu_items mi
  SET
    variations = strip_addons_from_variations(COALESCE(mi.variations, '[]'::jsonb))
      || jsonb_build_array(v_addon),
    updated_at = now()
  WHERE mi.category_id IN (
    SELECT c.id
    FROM public.menu_categories c
    WHERE
      c.parent_id IN ('cat-hot-beverages', 'cat-cold-beverages')
      OR c.id IN ('cat-hot-beverages', 'cat-cold-beverages')
      OR c.id IN (
        'cat-meal-replacement',
        'cat-loaded-tea-berry',
        'cat-loaded-tea-orange',
        'cat-loaded-tea-lime',
        'cat-loaded-tea-tropical',
        'cat-beauty-berry',
        'cat-beauty-lime',
        'cat-beauty-tropical',
        'cat-beauty-orange',
        'cat-specialty-berry',
        'cat-specialty-lime',
        'cat-specialty-tropical',
        'cat-specialty-orange',
        'cat-kids-berry',
        'cat-kids-orange'
      )
      OR lower(c.name) LIKE '%kids drink%'
      OR lower(c.name) LIKE '%meal replacement%'
      OR lower(c.name) LIKE '%specialty drink%'
      OR lower(c.name) LIKE '%beauty drink%'
      OR lower(c.name) LIKE '%loaded tea%'
      OR lower(trim(c.name)) = 'cold drinks'
      OR lower(c.name) LIKE 'cold drink%'
  );
END;
$$;

-- Optional: remove helper after you are done
-- DROP FUNCTION IF EXISTS public.strip_addons_from_variations(jsonb);
