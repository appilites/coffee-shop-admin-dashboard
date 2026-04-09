/**
 * Single Product API Routes — connected to Supabase
 * Reads  → anon/publishable key
 * Writes → service_role key (bypasses RLS)
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient, createServerSupabaseClient } from "@/lib/supabase-server"
import { computePriceData } from "@/lib/compute-variation-prices"
import { syncVariationsToCustomizationTables } from "@/lib/sync-variations-to-customization-tables"

// GET — Get product by ID (variations from menu_items.variations)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    const { data: product, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(
          id,
          name,
          parent_id,
          parent:menu_categories!parent_id(id, name)
        )
      `)
      .eq('id', id)
      .single()

    if (error?.code === 'PGRST116' || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    if (error) throw error
    
    const variations = Array.isArray(product.variations) ? product.variations : []
    const { calculatedTotalPrice, priceRange } = computePriceData(
      product.base_price,
      variations
    )

    const transformedProduct = {
      ...product,
      variations,
      calculatedTotalPrice,
      priceRange,
      loyaltyPointsEarn: product.loyalty_points_earn ?? 0,
      loyaltyPointsCost: product.loyalty_points_cost ?? 0,
    }

    return NextResponse.json(transformedProduct)
  } catch (error) {
    console.error('Error fetching product:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to fetch product", details: msg }, { status: 500 })
  }
}

// PUT — Update product (admin client bypasses RLS)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('Updating product with data:', body)
    const supabase = getSupabaseAdminClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined)        updateData.name          = String(body.name).trim()
    if (body.description !== undefined) updateData.description   = body.description?.trim() || null
    if (body.price !== undefined) {
      const price = parseFloat(body.price)
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ error: "Invalid price value" }, { status: 400 })
      }
      updateData.base_price = price
    }
    if (body.categoryId !== undefined)  updateData.category_id   = body.categoryId
    if (body.imageUrl !== undefined)    updateData.image_url     = body.imageUrl?.trim() || null
    if (body.isAvailable !== undefined) updateData.is_available  = Boolean(body.isAvailable)
    if (body.isFeatured !== undefined)  updateData.is_featured   = Boolean(body.isFeatured)
    
    // Handle variations update - write directly into menu_items.variations
    if (body.variations !== undefined) {
      updateData.variations = Array.isArray(body.variations) ? body.variations : []
    }
    if (body.loyaltyPointsEarn !== undefined)
      updateData.loyalty_points_earn = Math.max(0, Number(body.loyaltyPointsEarn) || 0)

    const { data: product, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:menu_categories(
          id,
          name,
          parent_id,
          parent:menu_categories!parent_id(id, name)
        )
      `)
      .single()

    if (error?.code === 'PGRST116') {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    if (error) {
      console.error('Error updating product:', error)
      if (error.code === '23503') return NextResponse.json({ error: "Invalid category selected" }, { status: 400 })
      if (error.code === '23505') return NextResponse.json({ error: "A product with this name already exists" }, { status: 400 })
      throw error
    }

    console.log('✅ Product updated successfully:', product)

    const variations = Array.isArray(product.variations) ? product.variations : []
    if (body.variations !== undefined) {
      const sync = await syncVariationsToCustomizationTables(supabase, id, variations)
      if (!sync.ok) {
        console.warn("⚠️ customization_options sync skipped or failed:", sync.error)
      }
    }

    const { calculatedTotalPrice, priceRange } = computePriceData(
      product.base_price,
      variations
    )

    const responseProduct = {
      ...product,
      variations,
      calculatedTotalPrice,
      priceRange,
    }

    return NextResponse.json(responseProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to update product", details: msg }, { status: 500 })
  }
}

// DELETE — Delete product (admin client bypasses RLS)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdminClient()

    // Delete customization options first (FK constraint)
    await supabase.from('customization_options').delete().eq('menu_item_id', id)

    const { error } = await supabase.from('menu_items').delete().eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to delete product", details: msg }, { status: 500 })
  }
}
