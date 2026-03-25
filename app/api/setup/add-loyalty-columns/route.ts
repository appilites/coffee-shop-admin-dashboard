import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient()

    // Add loyalty_points_earn — points customer earns when buying the product
    try {
      await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS loyalty_points_earn INTEGER DEFAULT 0 NOT NULL;`
      })
    } catch { /* column may already exist */ }

    // Add loyalty_points_cost — points required to redeem this product for free (0 = not a reward)
    try {
      await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS loyalty_points_cost INTEGER DEFAULT 0 NOT NULL;`
      })
    } catch { /* column may already exist */ }

    // Verify columns exist by reading schema
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, loyalty_points_earn, loyalty_points_cost')
      .limit(1)

    if (error) {
      // Columns don't exist yet — try direct update approach
      return NextResponse.json({
        success: false,
        message: "Please run this SQL in your Supabase SQL editor:",
        sql: `
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS loyalty_points_earn INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS loyalty_points_cost INTEGER DEFAULT 0 NOT NULL;
        `.trim(),
        error: error.message
      }, { status: 200 })
    }

    return NextResponse.json({
      success: true,
      message: "Loyalty columns are ready (loyalty_points_earn, loyalty_points_cost)",
      sample: data
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, loyalty_points_earn, loyalty_points_cost')
      .limit(1)

    if (error) {
      return NextResponse.json({
        columnsExist: false,
        sql: `
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS loyalty_points_earn INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS loyalty_points_cost INTEGER DEFAULT 0 NOT NULL;
        `.trim()
      })
    }

    return NextResponse.json({ columnsExist: true, sample: data })
  } catch (error) {
    return NextResponse.json({ columnsExist: false, error: String(error) })
  }
}
