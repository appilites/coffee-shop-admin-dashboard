import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

// Simple test endpoint
export async function GET() {
  try {
    console.log('🔍 Starting database exploration...')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasServiceKey = !!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: hasServiceKey,
      url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'missing'
    })
    
    if (!supabaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_SUPABASE_URL is not set'
      }, { status: 500 })
    }
    
    if (!hasServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is not set'
      }, { status: 500 })
    }
    
    const supabase = getSupabaseAdminClient()
    console.log('✅ Supabase client initialized')

    // Test basic connectivity first
    console.log('Testing basic connectivity...')
    const { data: testData, error: testError } = await supabase
      .from('menu_items')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('❌ Basic connectivity test failed:', testError)
      return NextResponse.json({
        success: false,
        error: `Database connection failed: ${testError.message}`,
        details: testError
      }, { status: 500 })
    }
    
    console.log('✅ Basic connectivity test passed')

    // Get basic table info
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, description')
      .limit(5)

    if (menuError) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch menu items: ${menuError.message}`,
        details: menuError
      }, { status: 500 })
    }

    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('id, name')
      .limit(5)

    if (categoriesError) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch categories: ${categoriesError.message}`,
        details: categoriesError
      }, { status: 500 })
    }

    // Check for existing variations
    const productsWithVariations = menuItems?.filter(p => 
      p.description && p.description.includes('[VARIATIONS:')
    ).length || 0

    const result = {
      success: true,
      message: `Successfully connected to database`,
      data: {
        accessibleTables: 2, // menu_items and menu_categories
        tableStructures: [
          {
            tableName: 'menu_items',
            recordCount: menuItems?.length || 0,
            accessible: true,
            hasVariationColumns: false
          },
          {
            tableName: 'menu_categories', 
            recordCount: categories?.length || 0,
            accessible: true,
            hasVariationColumns: false
          }
        ],
        currentProductsWithVariations: productsWithVariations,
        totalProducts: menuItems?.length || 0,
        environmentStatus: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: hasServiceKey
        }
      }
    }

    console.log('✅ Database exploration completed successfully')
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Error exploring database:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : 'No stack trace available'
    }, { status: 500 })
  }
}