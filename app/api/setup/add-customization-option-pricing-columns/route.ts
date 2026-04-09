import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

/**
 * Add max_included_selections + extra_selection_price to customization_options
 * so admin JSON variations can be mirrored for DB joins.
 */
export async function POST() {
  try {
    const supabase = getSupabaseAdminClient()

    const stmts = [
      `ALTER TABLE customization_options ADD COLUMN IF NOT EXISTS max_included_selections INTEGER NULL;`,
      `ALTER TABLE customization_options ADD COLUMN IF NOT EXISTS extra_selection_price NUMERIC(10, 2) NULL;`,
    ]

    for (const sql of stmts) {
      const { error } = await supabase.rpc("exec_sql", { sql })
      if (error) {
        console.warn("exec_sql pricing columns:", error)
      }
    }

    const { data, error } = await supabase
      .from("customization_options")
      .select("id, max_included_selections, extra_selection_price")
      .limit(1)

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Add columns manually if exec_sql is unavailable:",
          sql: stmts.join("\n"),
          error: error.message,
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "customization_options pricing columns are available",
      sample: data,
    })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    )
  }
}
