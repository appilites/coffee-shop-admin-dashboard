import { NextResponse } from "next/server"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export async function GET() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🔍 Running database diagnostics...')
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      connection: null as any,
      tables: {} as any,
      sampleData: {} as any,
      errors: [] as string[]
    }
    
    // Test 1: Basic connection
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id', { count: 'exact', head: true })
      
      if (error) {
        diagnostics.errors.push(`Connection test failed: ${error.message}`)
        diagnostics.connection = { status: 'failed', error: error.message }
      } else {
        diagnostics.connection = { status: 'success', itemCount: data }
      }
    } catch (err) {
      diagnostics.errors.push(`Connection exception: ${err}`)
      diagnostics.connection = { status: 'exception', error: String(err) }
    }
    
    // Test 2: Check table structures
    const tables = ['menu_categories', 'menu_items', 'locations']
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          diagnostics.tables[table] = { status: 'error', error: error.message }
          diagnostics.errors.push(`Table ${table}: ${error.message}`)
        } else {
          diagnostics.tables[table] = { status: 'exists', count }
        }
      } catch (err) {
        diagnostics.tables[table] = { status: 'exception', error: String(err) }
        diagnostics.errors.push(`Table ${table} exception: ${err}`)
      }
    }
    
    // Test 3: Get sample data
    try {
      const { data: categories, error: catError } = await supabase
        .from('menu_categories')
        .select('id, name, parent_id')
        .limit(3)
      
      if (catError) {
        diagnostics.sampleData.categories = { error: catError.message }
      } else {
        diagnostics.sampleData.categories = categories
      }
    } catch (err) {
      diagnostics.sampleData.categories = { exception: String(err) }
    }
    
    try {
      const { data: items, error: itemError } = await supabase
        .from('menu_items')
        .select('id, name, category_id, base_price')
        .limit(3)
      
      if (itemError) {
        diagnostics.sampleData.items = { error: itemError.message }
      } else {
        diagnostics.sampleData.items = items
      }
    } catch (err) {
      diagnostics.sampleData.items = { exception: String(err) }
    }
    
    // Test 4: Try a simple insert/delete to test permissions
    try {
      const testCategory = {
        id: `test-${Date.now()}`,
        name: 'Test Category',
        description: 'Test category for diagnostics',
        display_order: 999,
        is_active: true,
        parent_id: null
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('menu_categories')
        .insert(testCategory)
        .select()
        .single()
      
      if (insertError) {
        diagnostics.errors.push(`Insert test failed: ${insertError.message}`)
      } else {
        // Clean up
        await supabase
          .from('menu_categories')
          .delete()
          .eq('id', testCategory.id)
        
        diagnostics.sampleData.insertTest = { status: 'success', testId: testCategory.id }
      }
    } catch (err) {
      diagnostics.errors.push(`Insert test exception: ${err}`)
      diagnostics.sampleData.insertTest = { status: 'exception', error: String(err) }
    }
    
    console.log('📊 Diagnostics completed:', diagnostics)
    
    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error('❌ Diagnostics failed:', error)
    return NextResponse.json(
      { 
        error: 'Diagnostics failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}