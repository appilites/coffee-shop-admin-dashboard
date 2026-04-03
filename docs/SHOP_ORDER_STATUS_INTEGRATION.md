# Shop — Order status integration (admin ↔ same database)

**خلاصہ:** Admin dashboard order ka `status` **`orders` table** ke column **`status`** mein update karta hai. Shop ko **usi Supabase project** se `orders` row read karni chahiye — phir customer ko wahi status dikhega jo kitchen / admin ne set kiya ho.

---

## 1. Source of truth (ek hi column)

| Table | Column | Meaning |
|-------|--------|---------|
| `public.orders` | **`status`** | Kitchen / admin flow: `pending`, `confirmed`, `preparing`, `ready`, `delivered`, `completed`, `cancelled` |
| `public.orders` | **`updated_at`** | Last change time (status change par bhi update hota hai) |

Admin dashboard `PATCH /api/orders/[id]` yahi **`orders.status`** update karta hai (aur `updated_at`).

Shop ko **koi alag API invent karne ki zaroorat nahi** — bas Supabase se order fetch karte waqt `status` select karo.

---

## 2. Allowed `status` values (lowercase strings)

Dono apps (shop + admin) in values ko consistently use karein:

```txt
pending | confirmed | preparing | ready | delivered | completed | cancelled
```

**Naya order:** `orders.status` **default `pending`** hona chahiye — Supabase SQL: `docs/sql/orders-status-default-and-check.sql` (run once).

Kuch databases mein sirf `completed` hai, `delivered` CHECK mein nahi — admin API `delivered` fail hone par `completed` save kar sakti hai; behtar hai SQL se dono allow karo.

UI par inko labels se map kar sakte ho (English / Urdu text sirf display ke liye hai; DB mein hamesha yahi English lowercase values).

---

## 3. Shop par read — Supabase (recommended)

**Same** `NEXT_PUBLIC_SUPABASE_URL` aur `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ya publishable key) shop mein rakho — **service role key shop ke browser mein kabhi mat daalo.**

### 3.1 Ek order ka status (order ID pata ho)

```ts
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getOrderStatus(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, updated_at, total_amount")
    .eq("id", orderId)
    .single()

  if (error) throw error
  return data
  // data.status → admin ne jo set kiya wahi string
}
```

### 3.2 Logged-in user ki orders (agar `user_id` set hai)

```ts
const { data, error } = await supabase
  .from("orders")
  .select("id, order_number, status, payment_status, created_at, updated_at, total_amount")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
```

**RLS:** Agar shop se row nahi aa rahi, Supabase mein policy check karo — user ko sirf apni rows dikhane ke liye `user_id = auth.uid()` jaisa rule hona chahiye.

### 3.3 Guest order (email se match — optional)

Agar guest checkout par sirf email save hoti hai, tum policy / API se `customer_email` match karwa sakte ho — **secure** tareeqa: order ID + verification token ya short-lived session, na ke public email search.

---

## 4. Realtime — status turant update (optional)

Jab admin status change kare, shop page refresh ke baghair update chahiye ho to:

```ts
const channel = supabase
  .channel(`order-${orderId}`)
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "orders",
      filter: `id=eq.${orderId}`,
    },
    (payload) => {
      const newStatus = payload.new.status
      // setState / queryClient.invalidateQueries etc.
    }
  )
  .subscribe()

// cleanup: supabase.removeChannel(channel)
```

Supabase dashboard → **Replication** → `orders` ke liye realtime enable hona chahiye.

---

## 5. Next.js shop — Server Component / Route Handler (optional)

Agar browser se RLS block karta hai aur tum **session** server par verify karte ho, to shop ke **API route** mein `getServerSession` + Supabase **service role sirf server par** use kar sakte ho — lekin phir bhi sirf **usi user ki orders** return karna (security).

Pattern: customer never gets global admin access; sirf filtered `select`.

---

## 6. TypeScript — shop ke liye types (copy-paste)

```ts
export type OrderWorkflowStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "completed"
  | "cancelled"

export interface ShopOrderRow {
  id: string
  order_number: string
  status: OrderWorkflowStatus | string
  payment_status: string
  updated_at: string
  total_amount: number
}
```

---

## 7. UI labels (sirf display — DB value change mat karo)

Example mapping (Roman Urdu / English mix for customer):

```ts
const STATUS_LABELS: Record<string, string> = {
  pending: "Order received",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready for pickup",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
}
```

---

## 8. Checklist (shop team)

- [ ] Same Supabase project as admin dashboard  
- [ ] `orders.status` aur `updated_at` select karo  
- [ ] RLS policies: customer apni orders dekh sake  
- [ ] Optional: Realtime `UPDATE` on `orders` for live status  
- [ ] Service role key **never** in client bundle  

---

## 9. Related files (admin repo)

| File | Role |
|------|------|
| `app/api/orders/[id]/route.ts` | `PATCH` updates `orders.status` |
| `docs/ORDERS_INTEGRATION.md` | Full orders + `order_items` schema |

Is file ko apne **shop** repository mein copy karke `docs/` ya README ke saath rakh sakte ho taake dono teams align rahein.
