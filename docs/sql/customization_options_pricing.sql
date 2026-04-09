-- Run once in Supabase SQL editor (or POST /api/setup/add-customization-option-pricing-columns).
-- Links “extra fruit” style pricing to customization_options for relational queries / shop reads.

ALTER TABLE customization_options
  ADD COLUMN IF NOT EXISTS max_included_selections INTEGER NULL;

ALTER TABLE customization_options
  ADD COLUMN IF NOT EXISTS extra_selection_price NUMERIC(10, 2) NULL;

COMMENT ON COLUMN customization_options.max_included_selections IS
  'For multiple-select: first N choices use choice price_modifier only; see extra_selection_price.';
COMMENT ON COLUMN customization_options.extra_selection_price IS
  'For multiple-select: flat amount added per choice beyond max_included_selections (same currency as menu_items).';
