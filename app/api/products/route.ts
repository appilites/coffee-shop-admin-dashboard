/**
 * Products API Routes — connected to Supabase
 * Reads  → anon/publishable key (respects RLS)
 * Writes → service_role key (bypasses RLS)
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient, createServerSupabaseClient } from "@/lib/supabase-server"

// GET — List all products
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

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

    if (error) throw error

    // Transform the data to parse JSON variations and prices from description
    const transformedProducts = products?.map(product => {
      let variations = []
      let calculatedPrices = null
      let cleanDescription = product.description

      console.log(`Processing product: ${product.name}`)
      console.log(`Raw description: ${product.description}`)

      if (product.description) {
        // More flexible regex to handle newlines and spaces - same as individual product API
        const variationsMatch = product.description.match(/\[VARIATIONS:(.*?)\](?:\[PRICES:|$)/s)
        if (variationsMatch) {
          try {
            const variationsJson = variationsMatch[1].trim()
            variations = JSON.parse(variationsJson)
            console.log(`Found ${variations.length} variations for ${product.name}`)
          } catch (e) {
            console.warn('Could not parse variations from description:', e)
          }
        } else {
          console.log(`No variations found for ${product.name}`)
        }
        
        const pricesMatch = product.description.match(/\[PRICES:(.*?)\](?:\s|$)/s)
        if (pricesMatch) {
          try {
            const pricesJson = pricesMatch[1].trim()
            calculatedPrices = JSON.parse(pricesJson)
          } catch (e) {
            console.warn('Could not parse prices from description:', e)
          }
        }
        
        // Clean the description for display - same as individual product API
        cleanDescription = product.description
          .replace(/\n\n\[VARIATIONS:.*?\](\[PRICES:.*?\])?/s, '')
          .replace(/\[VARIATIONS:.*?\](\[PRICES:.*?\])?/s, '') || null
      }

      return {
        ...product,
        description: cleanDescription,
        variations: variations,
        calculatedTotalPrice: calculatedPrices?.calculatedTotalPrice || product.base_price,
        priceRange: calculatedPrices?.priceRange || { minPrice: product.base_price, maxPrice: product.base_price }
      }
    }) || []

    console.log(`Returning ${transformedProducts.length} products`)
    console.log('Products with variations:', transformedProducts.filter(p => p.variations.length > 0).map(p => ({ name: p.name, variationCount: p.variations.length })))

    return NextResponse.json(transformedProducts)
  } catch (error) {
    console.error('Error fetching products:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to fetch products", details: msg }, { status: 500 })
  }
}

// POST — Create product (admin client bypasses RLS)
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

    const insertData = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      description: body.description?.trim() || null,
      base_price: price,
      category_id: body.categoryId,
      image_url: body.imageUrl?.trim() || null,
      is_available: body.isAvailable !== false,
      is_featured: body.isFeatured === true,
      prep_time_minutes: 5,
      // Store calculated prices (we'll store these in the description for now)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // If we have variations, we need to store them somehow
    if (body.variations && body.variations.length > 0) {
      // Store variations and calculated prices in description
      const variationsJson = JSON.stringify(body.variations)
      const priceData = {
        calculatedTotalPrice: body.calculatedTotalPrice || price,
        priceRange: body.priceRange || { minPrice: price, maxPrice: price }
      }
      const priceDataJson = JSON.stringify(priceData)
      
      const originalDescription = insertData.description || ""
      insertData.description = originalDescription + 
        (originalDescription ? "\n\n" : "") + 
        `[VARIATIONS:${variationsJson}]` +
        `[PRICES:${priceDataJson}]`
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

    // Parse variations and prices back from description for response
    let variations = []
    let calculatedPrices = null
    if (product.description) {
      const variationsMatch = product.description.match(/\[VARIATIONS:(.*?)\]/)
      if (variationsMatch) {
        try {
          variations = JSON.parse(variationsMatch[1])
        } catch (e) {
          console.warn('Could not parse variations from description:', e)
        }
      }
      
      const pricesMatch = product.description.match(/\[PRICES:(.*?)\]/)
      if (pricesMatch) {
        try {
          calculatedPrices = JSON.parse(pricesMatch[1])
        } catch (e) {
          console.warn('Could not parse prices from description:', e)
        }
      }
      
      // Clean the description for display
      product.description = product.description
        .replace(/\n\n\[VARIATIONS:.*?\]/, '')
        .replace(/\[VARIATIONS:.*?\]/, '')
        .replace(/\[PRICES:.*?\]/, '') || null
    }

    // Parse variations back to object format for response
    const responseProduct = {
      ...product,
      variations: variations,
      calculatedTotalPrice: calculatedPrices?.calculatedTotalPrice || product.base_price,
      priceRange: calculatedPrices?.priceRange || { minPrice: product.base_price, maxPrice: product.base_price }
    }

    return NextResponse.json(responseProduct, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to create product", details: msg }, { status: 500 })
  }
}
