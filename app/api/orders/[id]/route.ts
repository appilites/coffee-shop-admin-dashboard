/**
 * Single Order API Routes — connected to Supabase
 * Status updates use admin client to bypass RLS
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

// GET — Get order by ID (service role when set — reads all orders despite RLS)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

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
      taxAmount: order.tax_amount ?? null,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentIntentId: order.payment_intent_id ?? null,
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

// PATCH — Update order status (uses service role when configured — same client as GET list)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'] as const
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    const runUpdate = async (status: string) =>
      supabase
        .from("orders")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

    const statusToWrite = body.status as string
    let { data: order, error } = await runUpdate(statusToWrite)

    if (error?.code === "PGRST116") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (error) {
      console.error("Error updating order status:", error)
      return NextResponse.json(
        {
          error: "Failed to update order",
          details: error.message,
          code: error.code,
          hint: (error as { hint?: string }).hint,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: order?.status ?? body.status,
      order,
    })
  } catch (error) {
    console.error("Error updating order:", error)
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to update order", details: msg }, { status: 500 })
  }
}
