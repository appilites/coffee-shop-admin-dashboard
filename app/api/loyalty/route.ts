import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

// GET — all loyalty rewards (products with loyalty_points_cost > 0)
//       plus summary stats
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: rewards, error: rewardsError } = await supabase
      .from('menu_items')
      .select(`
        id, name, description, base_price, image_url,
        loyalty_points_earn, loyalty_points_cost, is_available, is_featured,
        category:menu_categories(id, name, parent_id,
          parent:menu_categories!parent_id(id, name)
        )
      `)
      .gt('loyalty_points_cost', 0)
      .order('loyalty_points_cost', { ascending: true })

    if (rewardsError) throw rewardsError

    // Also return all products (for the "add reward" picker)
    const { data: allProducts, error: allError } = await supabase
      .from('menu_items')
      .select(`
        id, name, base_price, image_url, loyalty_points_earn, loyalty_points_cost,
        category:menu_categories(id, name)
      `)
      .order('name')

    if (allError) throw allError

    return NextResponse.json({
      rewards: rewards ?? [],
      allProducts: allProducts ?? [],
    })
  } catch (error) {
    console.error('Loyalty GET error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to fetch loyalty data", details: msg }, { status: 500 })
  }
}
