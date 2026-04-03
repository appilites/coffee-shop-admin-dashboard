/**
 * Orders API Routes — connected to Supabase
 * GET uses service role when configured (getSupabaseServerClient) so all rows are readable despite RLS.
 * Lists are paginated in chunks of 1000 so every order is returned (PostgREST default max per request).
 */

import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

const ORDERS_PAGE_SIZE = 1000

const ORDERS_SELECT = `
  *,
  items:order_items(
    *,
    product:menu_items(id, name, image_url)
  )
`

function mapOrdersToJson(orders: any[]) {
  return orders.map((order: any) => ({
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email || "",
    customerPhone: order.customer_phone,
    totalAmount: order.total_amount,
    taxAmount: order.tax_amount ?? null,
    status: order.status,
    paymentStatus: order.payment_status,
    pickupTime: order.pickup_time ?? null,
    specialNotes: order.special_instructions,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: (order.items || []).map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.unit_price,
      customizations: item.customizations || {},
      product: {
        id: item.product?.id || "",
        name: item.product?.name || item.item_name || "Unknown",
        imageUrl: item.product?.image_url || null,
      },
    })),
  }))
}

/** Fetch every order row by paging .range() — avoids PostgREST 1000-row default cap */
async function fetchAllOrdersFromDb(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>) {
  const all: any[] = []
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from("orders")
      .select(ORDERS_SELECT)
      .order("created_at", { ascending: false })
      .range(from, from + ORDERS_PAGE_SIZE - 1)

    if (error) throw error
    const batch = data || []
    all.push(...batch)
    if (batch.length < ORDERS_PAGE_SIZE) break
    from += ORDERS_PAGE_SIZE
  }
  return all
}

// GET — List all orders (entire table, paged server-side)
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    const rows = await fetchAllOrdersFromDb(supabase)
    const orders = mapOrdersToJson(rows)
    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to fetch orders", details: msg }, { status: 500 })
  }
}
