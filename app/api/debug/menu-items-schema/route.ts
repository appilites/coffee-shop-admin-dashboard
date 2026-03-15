import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    
    console.log('🔍 Checking menu_items table schema...')

    // Get table schema information
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'menu_items')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (schemaError) {
      console.error('Error getting schema:', schemaError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to get schema',
        details: schemaError 
      }, { status: 500 })
    }

    // Also get a sample record to see the actual structure
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('menu_items')
      .select('*')
      .limit(1)

    if (sampleError) {
      console.warn('Could not get sample record:', sampleError)
    }

    console.log('Schema columns:', columns)
    console.log('Sample record:', sampleRecord)

    return NextResponse.json({
      success: true,
      columns: columns || [],
      sampleRecord: sampleRecord?.[0] || null,
      hasVariationsColumn: columns?.some(col => col.column_name === 'variations') || false
    })

  } catch (error) {
    console.error('Error checking schema:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}