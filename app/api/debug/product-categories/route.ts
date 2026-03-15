import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get all products with their category relationships
    const { data: products, error } = await supabase
      .from('menu_items')
      .select(`
        id,
        name,
        category_id,
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
      .limit(5)

    if (error) throw error

    // Also get all categories to see the structure
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select(`
        id,
        name,
        parent_id,
        parent:menu_categories!parent_id(
          id,
          name
        )
      `)
      .order('name')

    if (catError) throw catError

    return NextResponse.json({
      success: true,
      products: products || [],
      categories: categories || [],
      analysis: {
        totalProducts: products?.length || 0,
        totalCategories: categories?.length || 0,
        productsWithCategories: products?.filter(p => p.category).length || 0,
        categoriesWithParents: categories?.filter(c => c.parent_id).length || 0
      }
    })

  } catch (error) {
    console.error('Error in debug-product-categories:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}