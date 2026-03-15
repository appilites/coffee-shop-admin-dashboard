import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: categories, error } = await supabase
      .from('menu_categories')
      .select(`
        *,
        parent:menu_categories!parent_id(
          id,
          name
        )
      `)
      .order('display_order')

    if (error) throw error

    // Debug: Log the raw data
    console.log('Raw categories data:', JSON.stringify(categories, null, 2))

    // Organize hierarchically for debugging
    const parentCategories = categories?.filter(c => !c.parent_id) || []
    const childCategories = categories?.filter(c => c.parent_id) || []

    const organized = {
      parents: parentCategories,
      children: childCategories,
      total: categories?.length || 0
    }

    console.log('Organized categories:', JSON.stringify(organized, null, 2))

    return NextResponse.json({
      raw: categories || [],
      organized,
      debug: {
        totalCategories: categories?.length || 0,
        parentCount: parentCategories.length,
        childCount: childCategories.length
      }
    })
  } catch (error) {
    console.error('Error in test-categories-hierarchy:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}