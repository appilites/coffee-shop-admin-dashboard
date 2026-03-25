/**
 * Categories API Routes — uses admin client (service_role) to bypass RLS
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient, createServerSupabaseClient } from "@/lib/supabase-server"

// GET — List all categories (read-only, anon key is fine)
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

    return NextResponse.json(categories || [])
  } catch (error) {
    console.error('Error fetching categories:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to fetch categories", details: msg }, { status: 500 })
  }
}

// POST — Create category (needs admin client to bypass RLS)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating category with data:', body)

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    // Enforce one-level hierarchy: only top-level categories can be parents.
    if (body.parentId) {
      const { data: parentCategory, error: parentError } = await supabase
        .from('menu_categories')
        .select('id, parent_id')
        .eq('id', body.parentId)
        .single()

      if (parentError || !parentCategory) {
        return NextResponse.json({ error: "Invalid parent category" }, { status: 400 })
      }

      if (parentCategory.parent_id) {
        return NextResponse.json({ error: "Only parent categories can be selected for subcategories" }, { status: 400 })
      }
    }

    const categoryData = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      description: body.description ? body.description.trim() : null,
      is_active: body.isActive !== false,
      display_order: 999,
      parent_id: body.parentId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('Inserting category data:', categoryData)

    const { data: category, error } = await supabase
      .from('menu_categories')
      .insert(categoryData)
      .select(`
        *,
        parent:menu_categories!parent_id(
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error creating category:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 })
      }
      if (error.code === '23503') {
        return NextResponse.json({ error: "Invalid parent category" }, { status: 400 })
      }
      throw error
    }

    console.log('Created category:', category)
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to create category", details: msg }, { status: 500 })
  }
}
