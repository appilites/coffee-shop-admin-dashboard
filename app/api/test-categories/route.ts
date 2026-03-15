import { NextResponse } from "next/server"
import { categoryService } from "@/lib/database"

export async function GET() {
  try {
    console.log('🧪 Testing categories API...')
    
    const categories = await categoryService.getAll()
    console.log('Categories from service:', categories)
    console.log('First category:', categories[0])
    
    return NextResponse.json({
      success: true,
      count: categories.length,
      categories: categories.slice(0, 5), // First 5 categories
      firstCategory: categories[0],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test categories error:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}