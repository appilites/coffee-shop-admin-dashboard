/**
 * Products API Routes — connected to Supabase
 * Reads  → anon/publishable key (respects RLS)
 * Writes → service_role key (bypasses RLS)
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient, createServerSupabaseClient, getSupabaseServerClient } from "@/lib/supabase-server"

// Helper to compute price range from variations
function computePriceData(basePrice: number, variations: any[] | null | undefined) {
  const safeVariations = Array.isArray(variations) ? variations : []
  let minPrice = basePrice
  let maxPrice = basePrice

  for (const variation of safeVariations) {
    const opts = Array.isArray(variation.options) ? variation.options : []
    if (variation.type === "radio") {
      const prices = opts.map((o: any) => Number(o.priceModifier ?? 0))
      if (prices.length) {
        minPrice += Math.min(...prices)
        maxPrice += Math.max(...prices)
      }
    } else {
      const sum = opts.reduce(
        (acc: number, o: any) => acc + Number(o.priceModifier ?? 0),
        0
      )
      maxPrice += sum
    }
  }

  return {
    calculatedTotalPrice: maxPrice,
    priceRange: { minPrice, maxPrice },
  }
}

// GET — List all products (variations stored in menu_items.variations)
export async function GET() {
  try {
    // Use server client that prefers admin/service role when available
    // This avoids RLS / permission issues when listing all products
    const supabase = await getSupabaseServerClient()

    const { data: products, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(
          id,
          name,
          parent_id,
          parent:menu_categories!parent_id(
            id,
            name
          )
        )
      `)
      .order('name')

    if (error) {
      console.error("Supabase error in /api/products GET:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: (error as any).code,
      })
      throw error
    }

    const transformedProducts = (products || []).map((product: any) => {
      const variations = Array.isArray(product.variations) ? product.variations : []
      const { calculatedTotalPrice, priceRange } = computePriceData(
        product.base_price,
        variations
      )

      return {
        ...product,
        variations,
        calculatedTotalPrice,
        priceRange,
      }
    })

    return NextResponse.json(transformedProducts)
  } catch (error: any) {
    console.error('Error fetching products:', error)
    const msg = error?.message || 'Unknown error'
    const details = error?.details || null
    const code = error?.code || null
    return NextResponse.json(
      { error: "Failed to fetch products", message: msg, details, code },
      { status: 500 }
    )
  }
}

// POST — Create product (admin client bypasses RLS, variations into menu_items.variations)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating product with data:', body)

    if (!body.name || !body.price || !body.categoryId) {
      const missing = ['name', 'price', 'categoryId'].filter(f => !body[f])
      return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 })
    }

    const price = parseFloat(body.price)
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: "Price must be a valid number greater than 0" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // Check if category exists
    const { data: category, error: categoryError } = await supabase
      .from('menu_categories')
      .select('id, name')
      .eq('id', body.categoryId)
      .single()

    if (categoryError || !category) {
      return NextResponse.json({ error: `Category not found: ${body.categoryId}` }, { status: 400 })
    }

    const insertData: any = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      description: body.description?.trim() || null,
      base_price: price,
      category_id: body.categoryId,
      image_url: body.imageUrl?.trim() || null,
      is_available: body.isAvailable !== false,
      is_featured: body.isFeatured === true,
      prep_time_minutes: 5,
      variations: Array.isArray(body.variations) ? body.variations : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: product, error } = await supabase
      .from('menu_items')
      .insert(insertData)
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

    if (error) {
      console.error('Error creating product:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: "A product with this name already exists" }, { status: 400 })
      }
      throw error
    }

    console.log('✅ Product created successfully:', product)

    const variations = Array.isArray(product.variations) ? product.variations : []
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

    return NextResponse.json(responseProduct, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to create product", details: msg }, { status: 500 })
  }
}
