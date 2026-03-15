/**
 * Single Category API Routes — uses admin client (service_role) to bypass RLS
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient, createServerSupabaseClient } from "@/lib/supabase-server"

// GET — Read single category (anon key is fine for reads)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    const { data: category, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 })
  }
}

// PUT — Update category (needs admin client to bypass RLS)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseAdminClient()

    // Validate parent category to prevent circular references
    if (body.parentId && body.parentId === id) {
      return NextResponse.json({ error: "Category cannot be its own parent" }, { status: 400 })
    }

    // Check if the parent category would create a circular reference
    if (body.parentId) {
      const { data: parentCategory, error: parentError } = await supabase
        .from('menu_categories')
        .select('parent_id')
        .eq('id', body.parentId)
        .single()

      if (parentError || !parentCategory) {
        return NextResponse.json({ error: "Invalid parent category" }, { status: 400 })
      }

      // Check if the parent category is a child of the current category
      let currentParentId = parentCategory.parent_id
      while (currentParentId) {
        if (currentParentId === id) {
          return NextResponse.json({ error: "Cannot create circular reference" }, { status: 400 })
        }
        
        const { data: nextParent } = await supabase
          .from('menu_categories')
          .select('parent_id')
          .eq('id', currentParentId)
          .single()
        
        currentParentId = nextParent?.parent_id
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (body.name) updateData.name = body.name.trim()
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.parentId !== undefined) updateData.parent_id = body.parentId || null

    const { data: category, error } = await supabase
      .from('menu_categories')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        parent:menu_categories!parent_id(
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error updating category:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 })
      }
      if (error.code === '23503') {
        return NextResponse.json({ error: "Invalid parent category" }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to update category", details: msg }, { status: 500 })
  }
}

// DELETE — Delete category (needs admin client to bypass RLS)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdminClient()

    // Check if category has children
    const { data: children, error: childrenError } = await supabase
      .from('menu_categories')
      .select('id')
      .eq('parent_id', id)

    if (childrenError) {
      throw childrenError
    }

    if (children && children.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete category with subcategories. Please delete subcategories first." 
      }, { status: 400 })
    }

    // Check if category has products
    const { data: products, error: productsError } = await supabase
      .from('menu_items')
      .select('id')
      .eq('category_id', id)

    if (productsError) {
      throw productsError
    }

    if (products && products.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete category with products. Please move or delete products first." 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to delete category", details: msg }, { status: 500 })
  }
}
