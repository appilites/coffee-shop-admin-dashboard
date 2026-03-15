import { NextResponse } from "next/server"
import { testProductCreation, testProductService } from "@/lib/test-product-creation"

export async function GET() {
  try {
    console.log('🧪 Running product creation tests...')
    
    const directTest = await testProductCreation()
    const serviceTest = await testProductService()
    
    return NextResponse.json({
      directTest,
      serviceTest,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}