import { NextResponse } from "next/server"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export async function GET() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🔍 Debugging categories...')
    
    // Check categories count
    const { count, error: countError } = await supabase
      .from('menu_categories')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      return NextResponse.json({ error: 'Count failed', details: countError }, { status: 500 })
    }
    
    // Get sample categories
    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .limit(10)
    
    if (categoriesError) {
      return NextResponse.json({ error: 'Categories fetch failed', details: categoriesError }, { status: 500 })
    }
    
    // Check products count
    const { count: productCount, error: productCountError } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
    
    if (productCountError) {
      return NextResponse.json({ error: 'Product count failed', details: productCountError }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      categoriesCount: count,
      productsCount: productCount,
      sampleCategories: categories,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug categories error:', error)
    return NextResponse.json(
      { 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}