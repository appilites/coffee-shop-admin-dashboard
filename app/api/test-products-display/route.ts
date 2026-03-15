import { NextResponse } from "next/server"
import { productService } from "@/lib/database"

export async function GET() {
  try {
    console.log('🧪 Testing products display...')
    
    const products = await productService.getAll()
    console.log('📊 Products from service:', products.length)
    
    // Get the last 5 products
    const recentProducts = products.slice(-5)
    
    return NextResponse.json({
      success: true,
      totalProducts: products.length,
      recentProducts: recentProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        category_id: p.category_id,
        base_price: p.base_price,
        is_available: p.is_available,
        created_at: p.created_at
      })),
      allProductIds: products.map((p: any) => p.id),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Test products display error:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}