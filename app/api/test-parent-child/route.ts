import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient()

    // First, create a parent category
    const parentData = {
      id: crypto.randomUUID(),
      name: "Test Parent Category",
      description: "This is a test parent category",
      is_active: true,
      display_order: 1,
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: parent, error: parentError } = await supabase
      .from('menu_categories')
      .insert(parentData)
      .select()
      .single()

    if (parentError) {
      console.error('Error creating parent:', parentError)
      throw parentError
    }

    // Then create a child category
    const childData = {
      id: crypto.randomUUID(),
      name: "Test Child Category",
      description: "This is a test child category",
      is_active: true,
      display_order: 1,
      parent_id: parent.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: child, error: childError } = await supabase
      .from('menu_categories')
      .insert(childData)
      .select(`
        *,
        parent:menu_categories!parent_id(
          id,
          name
        )
      `)
      .single()

    if (childError) {
      console.error('Error creating child:', childError)
      throw childError
    }

    // Fetch all categories to verify
    const { data: allCategories, error: fetchError } = await supabase
      .from('menu_categories')
      .select(`
        *,
        parent:menu_categories!parent_id(
          id,
          name
        )
      `)
      .order('display_order')

    if (fetchError) throw fetchError

    return NextResponse.json({
      success: true,
      parent,
      child,
      allCategories,
      message: "Test parent-child relationship created successfully"
    })
  } catch (error) {
    console.error('Error in test-parent-child:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}