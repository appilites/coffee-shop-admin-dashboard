import { NextResponse } from "next/server"
import { createVariationTables, createVariationTablesDirectSQL } from "@/lib/create-variation-tables"

export async function POST() {
  try {
    console.log('🚀 Setting up variation tables...')
    
    // First try to check existing tables
    const checkResult = await createVariationTablesDirectSQL()
    console.log('Check result:', checkResult)

    // Try to create tables
    const result = await createVariationTables()
    
    return NextResponse.json({
      success: true,
      message: "Variation tables setup completed",
      checkResult,
      createResult: result
    })
  } catch (error) {
    console.error('Error setting up variation tables:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}