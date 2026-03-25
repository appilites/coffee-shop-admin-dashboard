import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

// PUT — update loyalty_points_earn and/or loyalty_points_cost on a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await getSupabaseServerClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.loyaltyPointsEarn !== undefined)
      updateData.loyalty_points_earn = Math.max(0, Number(body.loyaltyPointsEarn) || 0)

    if (body.loyaltyPointsCost !== undefined)
      updateData.loyalty_points_cost = Math.max(0, Number(body.loyaltyPointsCost) || 0)

    const { data, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', id)
      .select('id, name, loyalty_points_earn, loyalty_points_cost')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Loyalty PUT error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to update loyalty points", details: msg }, { status: 500 })
  }
}

// DELETE — remove product from loyalty rewards (set loyalty_points_cost = 0)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('menu_items')
      .update({ loyalty_points_cost: 0, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Loyalty DELETE error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to remove loyalty reward", details: msg }, { status: 500 })
  }
}
