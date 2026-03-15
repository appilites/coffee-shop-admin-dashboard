import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    
    // Get ALL products to check their descriptions
    const { data: products, error } = await supabase
      .from('menu_items')
      .select('id, name, description')
      .order('name')

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 500 })
    }

    const results = products?.map(product => {
      let hasVariations = false
      let variationsCount = 0
      let parsedVariations = null
      let parseError = null
      
      if (product.description) {
        hasVariations = product.description.includes('[VARIATIONS:')
        
        if (hasVariations) {
          // Try to extract variations with multiple regex patterns
          let variationsMatch = product.description.match(/\[VARIATIONS:(.*?)\](?:\[PRICES:|$)/s)
          if (!variationsMatch) {
            variationsMatch = product.description.match(/\[VARIATIONS:(.*?)\]/)
          }
          
          if (variationsMatch) {
            try {
              const variationsJson = variationsMatch[1].trim()
              parsedVariations = JSON.parse(variationsJson)
              variationsCount = Array.isArray(parsedVariations) ? parsedVariations.length : 0
            } catch (e) {
              parseError = e instanceof Error ? e.message : 'Unknown parse error'
              console.error('Parse error for product', product.name, ':', e)
            }
          }
        }
      }
      
      return {
        id: product.id,
        name: product.name,
        hasDescription: !!product.description,
        descriptionLength: product.description?.length || 0,
        hasVariations,
        variationsCount,
        parseError,
        descriptionPreview: product.description ? 
          (product.description.length > 200 ? 
            product.description.substring(0, 200) + '...' : 
            product.description
          ) : null,
        variationsPreview: parsedVariations ? 
          parsedVariations.map((v: any) => ({ 
            title: v.title, 
            type: v.type, 
            optionsCount: v.options?.length || 0 
          })) : null
      }
    })

    return NextResponse.json({
      success: true,
      totalProducts: products?.length || 0,
      summary: {
        totalProducts: products?.length || 0,
        productsWithDescriptions: results?.filter(p => p.hasDescription).length || 0,
        productsWithVariations: results?.filter(p => p.hasVariations).length || 0,
        totalVariationsCount: results?.reduce((sum, p) => sum + p.variationsCount, 0) || 0
      },
      products: results
    })

  } catch (error) {
    console.error('Error checking database:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}