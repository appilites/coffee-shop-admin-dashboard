-- Run in Supabase SQL Editor if order status updates fail (500) or CHECK rejects values.
-- 1) New orders default to pending
-- 2) Allow all workflow statuses including "delivered"

-- Default for new rows (adjust if your column already has a default)
ALTER TABLE public.orders
  ALTER COLUMN status SET DEFAULT 'pending';

-- If you have an old CHECK constraint, replace it (name may differ — check in:
-- Table Editor → orders → constraints, or: SELECT conname FROM pg_constraint WHERE conrelid = 'public.orders'::regclass)

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (
    status = ANY (
      ARRAY[
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'delivered',
        'completed',
        'cancelled'
      ]::text[]
    )
  );
