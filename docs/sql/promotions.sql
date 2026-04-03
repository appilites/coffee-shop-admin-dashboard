-- =============================================================================
-- Promotions — run in Supabase SQL Editor (once)
-- Banners / deals shown on the shop; optional link to a menu product.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  -- Link to shop product (menu_items.id). NULL = image-only or use external_url
  menu_item_id TEXT REFERENCES public.menu_items (id) ON DELETE SET NULL,
  -- Optional: open a custom URL instead of product (shop can prefer one)
  external_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotions_active_sort
  ON public.promotions (is_active, sort_order DESC);

CREATE INDEX IF NOT EXISTS idx_promotions_menu_item
  ON public.promotions (menu_item_id)
  WHERE menu_item_id IS NOT NULL;

COMMENT ON TABLE public.promotions IS 'Marketing banners; shop reads active rows ordered by sort_order';

-- -----------------------------------------------------------------------------
-- Row Level Security (adjust to your auth model)
-- -----------------------------------------------------------------------------
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Public read of active promotions (anon key on shop)
CREATE POLICY "Anyone can read active promotions"
  ON public.promotions
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admin dashboard uses the service_role / secret key in API routes — it bypasses RLS.
-- If you ever call Supabase with ONLY the anon key for ALL rows, add:
--   CREATE POLICY "promotions_select_all_for_service" ... (not needed when using service_role client)

GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT ALL ON public.promotions TO service_role;

-- Full access for service role is implicit (bypasses RLS).
-- If dashboard uses only service role in API routes, no extra policy needed for writes.
-- If you use authenticated admin JWT in Supabase, add policies for insert/update/delete.

-- Example: allow authenticated users full CRUD (replace with your admin role check)
-- CREATE POLICY "Admins manage promotions"
--   ON public.promotions
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);
