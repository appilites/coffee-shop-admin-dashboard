/**
 * Cleanup API - Removes [VARIATIONS:...] and [PRICES:...] tags from product descriptions
 * These tags were used in the old system; variations are now stored in the JSONB column
 */

import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

// GET - Preview products that need cleanup
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    
    const { data: products, error } = await supabase
      .from('menu_items')
      .select('id, name, description')
      .or('description.ilike.%[VARIATIONS:%,description.ilike.%[PRICES:%')

    if (error) throw error

    const productsNeedingCleanup = (products || []).map(p => ({
      id: p.id,
      name: p.name,
      hasVariationsTag: p.description?.includes('[VARIATIONS:') || false,
      hasPricesTag: p.description?.includes('[PRICES:') || false,
      descriptionPreview: p.description?.substring(0, 100) + (p.description?.length > 100 ? '...' : '')
    }))

    return NextResponse.json({
      success: true,
      count: productsNeedingCleanup.length,
      products: productsNeedingCleanup
    })

  } catch (error) {
    console.error('Error checking descriptions:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Execute cleanup on all products
export async function POST() {
  try {
    const supabase = getSupabaseAdminClient()
    
    // Get all products with variation/price tags in description
    const { data: products, error: fetchError } = await supabase
      .from('menu_items')
      .select('id, name, description')
      .or('description.ilike.%[VARIATIONS:%,description.ilike.%[PRICES:%')

    if (fetchError) throw fetchError

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products need cleanup',
        updated: 0
      })
    }

    const results: { id: string; name: string; success: boolean; error?: string }[] = []

    for (const product of products) {
      try {
        let cleanDescription = product.description || ""
        
        // Remove [VARIATIONS:...] and [PRICES:...] tags
        cleanDescription = cleanDescription
          .replace(/\n\n\[VARIATIONS:.*?\](\[PRICES:.*?\])?/gs, '')
          .replace(/\[VARIATIONS:.*?\](\[PRICES:.*?\])?/gs, '')
          .replace(/\[PRICES:.*?\]/gs, '')
          .trim()

        // Set to null if empty after cleanup
        const finalDescription = cleanDescription || null

        const { error: updateError } = await supabase
          .from('menu_items')
          .update({
            description: finalDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)

        if (updateError) {
          results.push({ id: product.id, name: product.name, success: false, error: updateError.message })
        } else {
          results.push({ id: product.id, name: product.name, success: true })
        }
      } catch (err) {
        results.push({ 
          id: product.id, 
          name: product.name, 
          success: false, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: failureCount === 0,
      message: `Cleaned ${successCount} product descriptions${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      updated: successCount,
      failed: failureCount,
      results
    })

  } catch (error) {
    console.error('Error cleaning descriptions:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
