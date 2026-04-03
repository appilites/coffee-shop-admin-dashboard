# Orders — Dashboard integration guide

This document explains how customer orders from the **shop** are stored and how a **separate admin dashboard** (or any backend) can **read** and **update** them so orders show and are handled correctly.

---

## Where orders live

Orders are stored in **Supabase** (PostgreSQL), not only in the browser.

| Table | Purpose |
|--------|---------|
| `orders` | One row per order: customer, totals, status, payment |
| `order_items` | Line items: product, quantity, prices, customizations JSON |

The shop creates rows when the customer checks out (`POST /api/create-order`) and updates payment status after the payment step (`POST /api/confirm-payment`). Those routes live on the **storefront** app, not necessarily in this repo.

---

## `orders` row (main fields)

Use these columns in your dashboard UI and filters.

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID | Primary key — use in URLs and updates |
| `order_number` | text | Human-readable, e.g. `ORD-1730...` |
| `user_id` | UUID, nullable | Set when customer is logged in |
| `customer_name` | text | Required for checkout |
| `customer_email` | text | |
| `customer_phone` | text, nullable | |
| `total_amount` | numeric | Includes tax |
| `tax_amount` | numeric | |
| `status` | text | See [Order status values](#order-status-values) below |
| `payment_status` | text | `pending`, `paid`, `failed`, `refunded` |
| `payment_intent_id` | text, nullable | Set after payment |
| `pickup_time` | timestamptz, nullable | Customer preference |
| `special_instructions` | text, nullable | |
| `is_guest_order` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Optional columns may exist in your project (e.g. `location_id`, `estimated_ready_time`) — read from Supabase or your migrations.

### Order status values

**This admin dashboard** (`PATCH /api/orders/[id]`) accepts:

`pending` → `confirmed` → `preparing` → `ready` → `delivered` → or `cancelled`

If your shop uses `completed` instead of `delivered`, align them in Supabase or map them in the UI so both apps stay consistent.

---

## `order_items` row

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID | |
| `order_id` | UUID | FK → `orders.id` |
| `menu_item_id` | text | FK → `menu_items.id` |
| `item_name` | text | Snapshot at order time |
| `quantity` | int | |
| `unit_price` | numeric | Per unit |
| `total_price` | numeric | Line total |
| `customizations` | jsonb | Array or object from the shop cart (options / choices / variations) |

---

## Shop API routes (reference — storefront)

These run on the **same Next.js app** as the storefront. Your dashboard does **not** have to call them if it talks to Supabase directly — they are documented so behavior matches.

### `POST /api/create-order`

- **Body (JSON):** `items[]` (each with `menu_item_id`, `name`, `quantity`, `totalPrice`, `customizations`), `customer_name`, `customer_email`, `customer_phone`, optional `user_id`, `special_instructions`, `pickup_time`, `is_guest_order`.
- **Effect:** Inserts one `orders` row and related `order_items` rows.
- **Server:** Uses **service role** when `SUPABASE_SERVICE_ROLE_KEY` is set (recommended for production).

### `POST /api/confirm-payment`

- **Body:** `{ "orderId": "<uuid>", "paymentIntentId": "..." }`
- **Effect:** Sets `payment_status` to `paid`, `status` to `confirmed`, stores `payment_intent_id`.

Typical storefront files (names may vary by project):

| File (shop) | Role |
|-------------|------|
| `app/api/create-order/route.ts` | Creates DB order + line items |
| `app/api/confirm-payment/route.ts` | Marks order paid / confirmed |
| `app/checkout/page.tsx` | Calls create-order before payment |
| `app/payment/page.tsx` | Calls confirm-payment after payment |

---

## This admin dashboard — REST API (reference)

These routes exist in **this** repo and power the Orders pages:

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/orders` | List **all** orders from the DB (paged in 1000-row chunks server-side; uses service role when `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` is set so RLS does not hide rows) |
| `GET` | `/api/orders/[id]` | Single order (same shape, camelCase in JSON response) |
| `PATCH` | `/api/orders/[id]` | Update `status` — body: `{ "status": "preparing" }` |

Valid `status` values for `PATCH`: `pending`, `confirmed`, `preparing`, `ready`, `delivered`, `cancelled`.

---

## Dashboard: recommended approach (Supabase directly)

### 1. Environment

In the dashboard app, set:

- `NEXT_PUBLIC_SUPABASE_URL` — same project as the shop  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — for **client-side** reads if RLS allows  
- **`SUPABASE_SERVICE_ROLE_KEY`** (or `SUPABASE_SECRET_KEY` / service role as configured in this project) — **only on the server** (API routes / server actions) for full access if RLS blocks the anon key  

Never expose the service role in browser code.

### 2. Fetch orders (example query)

```sql
select
  o.*,
  json_agg(
    json_build_object(
      'id', oi.id,
      'item_name', oi.item_name,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'total_price', oi.total_price,
      'customizations', oi.customizations
    )
  ) filter (where oi.id is not null) as items
from orders o
left join order_items oi on oi.order_id = o.id
group by o.id
order by o.created_at desc;
```

In JS (Supabase client):

```ts
const { data, error } = await supabase
  .from("orders")
  .select(`
    *,
    items:order_items (*)
  `)
  .order("created_at", { ascending: false })
```

### 3. Update order status (kitchen / admin)

```ts
await supabase
  .from("orders")
  .update({
    status: "preparing", // or confirmed, ready, delivered, cancelled
    updated_at: new Date().toISOString(),
  })
  .eq("id", orderId)
```

Use the same `status` values this dashboard’s `PATCH` accepts (see above).

### 4. Realtime (optional)

Subscribe to `postgres_changes` on `public.orders` (and optionally `order_items`) so the dashboard refreshes when new orders arrive.

---

## Row Level Security (RLS)

If the dashboard **cannot** read or update `orders` with the **anon** key:

1. Add policies so **authenticated admin users** can `select` / `update` `orders` and `order_items`, **or**
2. Perform all dashboard mutations from **server-side** code using the **service role** (never ship the service key to the client).

This project’s `PATCH /api/orders/[id]` uses the admin Supabase client so status updates can bypass RLS when configured.

---

## Checklist for your dashboard team

- [ ] Same Supabase project URL and keys as the shop (or service role on server only).  
- [ ] List view: query `orders` with `order_items` (join or nested select).  
- [ ] Detail view: filter `order_items` by `order_id`.  
- [ ] Actions: `update` `orders.status` (and `payment_status` only if your flow needs it).  
- [ ] New orders from the shop appear after checkout + create-order; status becomes **paid/confirmed** after the customer completes the payment step (confirm-payment).  

---

## File reference — **this** admin-dashboard repo

| File | Role |
|------|------|
| `app/api/orders/route.ts` | `GET` — list orders + items + product join (`taxAmount`, `pickupTime` included when present) |
| `app/api/orders/[id]/route.ts` | `GET` one order, `PATCH` status (`completed` allowed as well as `delivered`) |
| `app/(dashboard)/orders/page.tsx` | Orders list — loads via **`fetch('/api/orders')`** (same Supabase data as the shop) |
| `app/(dashboard)/orders/[id]/page.tsx` | Order detail — **`fetch('/api/orders/[id]')`**, status dropdown calls **`PATCH`** |
| `components/orders/orders-table.tsx` | Legacy table component (not used by the orders page; can be wired to the same API later) |

Shop-side files (`create-order`, `checkout`, `payment`) live in your **storefront** repository if they are not present here.

---

## Support

If orders still do not appear: verify `SUPABASE_SERVICE_ROLE_KEY` on the **shop** deployment (so create-order succeeds), confirm RLS policies allow the dashboard’s client or server role to `select` on `orders`, and check Supabase **Table Editor** for new rows in `orders` after a test purchase.
