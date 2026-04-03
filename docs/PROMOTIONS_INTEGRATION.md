# Promotions — Shop integration guide

Promotions are **banners / deals** managed in the admin dashboard (**Settings → Promotions**). They live in Supabase table **`promotions`** and can optionally link to a **`menu_items`** product.

---

## 1. Database setup (once)

Run the SQL file in **Supabase → SQL Editor**:

**File:** `docs/sql/promotions.sql`

It creates:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `name` | text | Promotion title |
| `image_url` | text | Public image URL (upload via admin → Supabase Storage `product-images/promotions/`) |
| `description` | text, nullable | Short copy |
| `menu_item_id` | text, nullable | FK → `menu_items.id` — product to open on the shop |
| `external_url` | text, nullable | Optional URL if you do not use a product link |
| `is_active` | boolean | Only **active** rows should show on the shop |
| `sort_order` | int | Lower numbers first |
| `created_at` / `updated_at` | timestamptz | Metadata |

**RLS:** Anonymous users can `SELECT` rows where `is_active = true` (shop). The admin API uses the **service role** for full CRUD.

---

## 2. Admin dashboard

| Route | Purpose |
|-------|---------|
| `/settings/promotions` | Create / edit / delete promotions, upload image, pick product |

**API (same origin as dashboard):**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/promotions` | All promotions (admin) |
| `GET` | `/api/promotions?public=1` | **Active only** — intended for shop-style reads |
| `POST` | `/api/promotions` | Create |
| `PUT` | `/api/promotions/[id]` | Update |
| `DELETE` | `/api/promotions/[id]` | Delete |

Upload images with `POST /api/upload` and form field **`folder` = `promotions`** (stored under `product-images/promotions/`).

---

## 3. Shop: fetch active promotions

Use the **same** Supabase project as the admin. Prefer **`?public=1`** or query the table directly with `is_active = true`.

### 3.1 From your shop’s Next.js API (server)

```ts
// app/api/shop-promotions/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const res = await fetch(`${base}/api/promotions?public=1`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  })
  if (!res.ok) return NextResponse.json([], { status: 200 })
  const data = await res.json()
  return NextResponse.json(Array.isArray(data) ? data : [])
}
```

*(Adjust `NEXT_PUBLIC_SITE_URL` to your **admin** dashboard URL if shop and admin are different deployments.)*

### 3.2 Direct Supabase (browser or server)

```ts
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getActivePromotions() {
  const { data, error } = await supabase
    .from("promotions")
    .select("id, name, image_url, description, menu_item_id, external_url, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) throw error
  return data ?? []
}
```

---

## 4. JSON shape (camelCase from admin API)

Example item from `GET /api/promotions?public=1`:

```json
{
  "id": "uuid",
  "name": "Weekend Latte",
  "imageUrl": "https://....supabase.co/storage/v1/object/public/product-images/promotions/....jpg",
  "description": "Buy any large",
  "menuItemId": "a1b2c3d4-...",
  "externalUrl": null,
  "isActive": true,
  "sortOrder": 0,
  "createdAt": "...",
  "updatedAt": "...",
  "product": {
    "id": "a1b2c3d4-...",
    "name": "Caramel Latte",
    "imageUrl": "...",
    "basePrice": 4.5
  }
}
```

Raw Supabase rows use **`snake_case`** (`image_url`, `menu_item_id`).

---

## 5. Shop UI behaviour (recommended)

1. Render a **carousel / grid** of promotions ordered by `sortOrder`.
2. On tap:
   - If **`menuItemId`** is set → navigate to product detail ` /product/[menuItemId] ` (or your route).
   - Else if **`externalUrl`** is set → open in new tab or in-app browser.
   - Else → show image only or a generic “offers” page.
3. Use **`imageUrl`** for the banner image and **`name`** / **`description`** for accessibility and captions.

---

## 6. Checklist

- [ ] Run `docs/sql/promotions.sql` in Supabase.  
- [ ] Admin dashboard has `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) so CRUD works.  
- [ ] Shop uses anon key + RLS policy for `SELECT` on active rows **or** calls admin `GET ...?public=1` from server.  
- [ ] If admin and shop are on **different domains**, configure CORS / server-side fetch to the admin API, or read Supabase directly from the shop with anon key.  

---

## 7. Files in this repo

| Path | Role |
|------|------|
| `docs/sql/promotions.sql` | Table + RLS |
| `app/api/promotions/route.ts` | List + create |
| `app/api/promotions/[id]/route.ts` | Update + delete |
| `app/(dashboard)/settings/promotions/page.tsx` | Admin UI |
| `app/api/upload/route.ts` | `folder=promotions` for images |
