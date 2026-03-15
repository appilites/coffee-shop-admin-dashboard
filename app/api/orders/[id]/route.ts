/**
 * Single Order API Routes — connected to Supabase
 * Status updates use admin client to bypass RLS
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient, createServerSupabaseClient } from "@/lib/supabase-server"

// GET — Get order by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:menu_items(id, name, image_url)
        )
      `)
      .eq('id', id)
      .single()

    if (error?.code === 'PGRST116' || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    if (error) throw error

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to fetch order", details: msg }, { status: 500 })
  }
}

// PATCH — Update order status (admin client bypasses RLS)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error?.code === 'PGRST116') {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    if (error) {
      console.error('Error updating order status:', error)
      throw error
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Error updating order:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to update order", details: msg }, { status: 500 })
  }
}
