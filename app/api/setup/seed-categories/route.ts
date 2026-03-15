/**
 * Seed default coffee shop categories into Supabase
 * POST /api/setup/seed-categories
 */

import { NextResponse } from "next/server"
import { getSupabaseAdminClient, createServerSupabaseClient } from "@/lib/supabase-server"

const DEFAULT_CATEGORIES = [
  // ── Parent Categories ──────────────────────────────────────────────────
  {
    id: "cat-hot-beverages",
    name: "Hot Beverages",
    description: "Warm drinks crafted with care",
    is_active: true,
    display_order: 1,
    parent_id: null,
  },
  {
    id: "cat-cold-beverages",
    name: "Cold Beverages",
    description: "Refreshing chilled drinks",
    is_active: true,
    display_order: 2,
    parent_id: null,
  },
  {
    id: "cat-food",
    name: "Food",
    description: "Delicious food to complement your drink",
    is_active: true,
    display_order: 3,
    parent_id: null,
  },
  // ── Hot Beverages Subcategories ────────────────────────────────────────
  {
    id: "cat-espresso",
    name: "Espresso Drinks",
    description: "Espresso-based classics — Latte, Cappuccino, Americano",
    is_active: true,
    display_order: 1,
    parent_id: "cat-hot-beverages",
  },
  {
    id: "cat-brewed-coffee",
    name: "Brewed Coffee",
    description: "Classic drip and pour-over coffees",
    is_active: true,
    display_order: 2,
    parent_id: "cat-hot-beverages",
  },
  {
    id: "cat-hot-tea",
    name: "Hot Tea",
    description: "Green, black, herbal, and chai teas",
    is_active: true,
    display_order: 3,
    parent_id: "cat-hot-beverages",
  },
  {
    id: "cat-hot-chocolate",
    name: "Hot Chocolate",
    description: "Rich and creamy hot chocolate blends",
    is_active: true,
    display_order: 4,
    parent_id: "cat-hot-beverages",
  },
  // ── Cold Beverages Subcategories ───────────────────────────────────────
  {
    id: "cat-iced-coffee",
    name: "Iced Coffee",
    description: "Chilled espresso drinks over ice",
    is_active: true,
    display_order: 1,
    parent_id: "cat-cold-beverages",
  },
  {
    id: "cat-cold-brew",
    name: "Cold Brew",
    description: "Slow-steeped cold brew coffee",
    is_active: true,
    display_order: 2,
    parent_id: "cat-cold-beverages",
  },
  {
    id: "cat-smoothies",
    name: "Smoothies & Shakes",
    description: "Fruit smoothies and creamy milkshakes",
    is_active: true,
    display_order: 3,
    parent_id: "cat-cold-beverages",
  },
  {
    id: "cat-lemonade",
    name: "Lemonade & Juices",
    description: "Fresh-squeezed lemonades and juices",
    is_active: true,
    display_order: 4,
    parent_id: "cat-cold-beverages",
  },
  // ── Food Subcategories ─────────────────────────────────────────────────
  {
    id: "cat-pastries",
    name: "Pastries & Bakery",
    description: "Freshly baked muffins, croissants, and cakes",
    is_active: true,
    display_order: 1,
    parent_id: "cat-food",
  },
  {
    id: "cat-sandwiches",
    name: "Sandwiches & Wraps",
    description: "Freshly prepared sandwiches and wraps",
    is_active: true,
    display_order: 2,
    parent_id: "cat-food",
  },
  {
    id: "cat-snacks",
    name: "Snacks",
    description: "Light bites and snacks",
    is_active: true,
    display_order: 3,
    parent_id: "cat-food",
  },
]

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient()

    // Check existing categories
    const { data: existing } = await supabase
      .from('menu_categories')
      .select('id')

    const existingIds = new Set((existing || []).map((c: { id: string }) => c.id))
    const toInsert = DEFAULT_CATEGORIES.filter(c => !existingIds.has(c.id))

    if (toInsert.length === 0) {
      return NextResponse.json({
        message: "All default categories already exist",
        total: DEFAULT_CATEGORIES.length,
        inserted: 0,
      })
    }

    // Insert parents first, then children (to satisfy FK constraint)
    const parents = toInsert.filter(c => c.parent_id === null)
    const children = toInsert.filter(c => c.parent_id !== null)

    let insertedCount = 0

    if (parents.length > 0) {
      const { error: parentError } = await supabase
        .from('menu_categories')
        .insert(parents.map(c => ({ ...c, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })))

      if (parentError) {
        console.error('Error inserting parent categories:', parentError)
        throw parentError
      }
      insertedCount += parents.length
    }

    if (children.length > 0) {
      const { error: childError } = await supabase
        .from('menu_categories')
        .insert(children.map(c => ({ ...c, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })))

      if (childError) {
        console.error('Error inserting subcategories:', childError)
        throw childError
      }
      insertedCount += children.length
    }

    return NextResponse.json({
      message: `Successfully seeded ${insertedCount} categories`,
      total: DEFAULT_CATEGORIES.length,
      inserted: insertedCount,
      skipped: DEFAULT_CATEGORIES.length - insertedCount,
    })
  } catch (error) {
    console.error('Seed error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to seed categories", details: msg }, { status: 500 })
  }
}

// GET - Check current state
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('menu_categories')
      .select('id, name, parent_id, is_active')
      .order('display_order')

    if (error) throw error

    return NextResponse.json({
      categories: data || [],
      count: data?.length || 0,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to check categories", details: msg }, { status: 500 })
  }
}
