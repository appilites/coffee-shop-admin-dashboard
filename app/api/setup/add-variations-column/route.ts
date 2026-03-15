import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient()
    
    console.log('🚀 Adding variations column to menu_items table...')

    // Check if the column already exists
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'menu_items')
      .eq('table_schema', 'public')
      .eq('column_name', 'variations')

    if (checkError) {
      console.error('Error checking for variations column:', checkError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check for variations column',
        details: checkError 
      }, { status: 500 })
    }

    if (columns && columns.length > 0) {
      console.log('✅ Variations column already exists')
      return NextResponse.json({
        success: true,
        message: "Variations column already exists"
      })
    }

    // Add the variations column as JSONB
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS variations JSONB;`
    })

    if (alterError) {
      console.error('Error adding variations column:', alterError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to add variations column',
        details: alterError 
      }, { status: 500 })
    }

    console.log('✅ Variations column added successfully')

    return NextResponse.json({
      success: true,
      message: "Variations column added successfully"
    })

  } catch (error) {
    console.error('Error adding variations column:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}