import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    
    // Get a few products to check their descriptions
    const { data: products, error } = await supabase
      .from('menu_items')
      .select('id, name, description')
      .limit(5)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results = products?.map(product => {
      let variations = []
      let hasVariationsMarker = false
      
      if (product.description) {
        hasVariationsMarker = product.description.includes('[VARIATIONS:')
        
        // Try to extract variations
        const variationsMatch = product.description.match(/\[VARIATIONS:(.*?)\]/)
        if (variationsMatch) {
          try {
            variations = JSON.parse(variationsMatch[1])
          } catch (e) {
            console.error('Parse error:', e)
          }
        }
      }
      
      return {
        id: product.id,
        name: product.name,
        hasDescription: !!product.description,
        hasVariationsMarker,
        descriptionLength: product.description?.length || 0,
        variationsCount: variations.length,
        rawDescription: product.description,
        parsedVariations: variations
      }
    })

    return NextResponse.json({
      success: true,
      products: results
    })

  } catch (error) {
    console.error('Error checking variations:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}