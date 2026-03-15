import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()

    // Get all categories with their relationships
    const { data: categories, error } = await supabase
      .from('menu_categories')
      .select(`
        id,
        name,
        description,
        parent_id,
        is_active,
        display_order,
        created_at,
        updated_at
      `)
      .order('created_at')

    if (error) throw error

    // Analyze the structure
    const analysis = {
      total: categories?.length || 0,
      topLevel: categories?.filter(c => !c.parent_id) || [],
      withParent: categories?.filter(c => c.parent_id) || [],
      relationships: categories?.map(c => ({
        id: c.id,
        name: c.name,
        parent_id: c.parent_id,
        hasParent: !!c.parent_id
      })) || []
    }

    return NextResponse.json({
      categories: categories || [],
      analysis,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in debug-categories-structure:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}