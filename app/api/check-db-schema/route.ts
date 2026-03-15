import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()

    // Check if the menu_categories table exists and its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'menu_categories')
      .eq('table_schema', 'public')

    if (tableError) {
      console.error('Error checking table schema:', tableError)
    }

    // Check foreign key constraints
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'menu_categories')
      .eq('table_schema', 'public')

    if (constraintError) {
      console.error('Error checking constraints:', constraintError)
    }

    // Try to get some sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('menu_categories')
      .select('*')
      .limit(5)

    if (sampleError) {
      console.error('Error getting sample data:', sampleError)
    }

    return NextResponse.json({
      tableInfo: tableInfo || [],
      constraints: constraints || [],
      sampleData: sampleData || [],
      errors: {
        tableError: tableError?.message,
        constraintError: constraintError?.message,
        sampleError: sampleError?.message
      }
    })
  } catch (error) {
    console.error('Error in check-db-schema:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}