/**
 * Orders API Routes — connected to Supabase
 */

import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// GET — List all orders
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:menu_items(id, name, image_url)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const orders = (data || []).map((order: any) => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone,
      totalAmount: order.total_amount,
      status: order.status,
      paymentStatus: order.payment_status,
      specialNotes: order.special_instructions,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.unit_price,
        customizations: item.customizations || {},
        product: {
          id: item.product?.id || '',
          name: item.product?.name || item.item_name || 'Unknown',
          imageUrl: item.product?.image_url || null,
        },
      })),
    }))

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to fetch orders", details: msg }, { status: 500 })
  }
}
