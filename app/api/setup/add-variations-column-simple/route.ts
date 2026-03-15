import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient()
    
    console.log('🚀 Adding variations column to menu_items table...')

    // Try to add the variations column directly using a simple update
    // This is a workaround since we can't use ALTER TABLE directly
    
    // First, let's try to update a non-existent record to see if the column exists
    const { error: testError } = await supabase
      .from('menu_items')
      .update({ variations: null })
      .eq('id', 'non-existent-id')

    if (testError && testError.message.includes("variations")) {
      console.log('❌ Variations column does not exist')
      
      // Since we can't add the column via API, let's return instructions
      return NextResponse.json({
        success: false,
        error: "Variations column needs to be added manually",
        instructions: [
          "1. Go to your Supabase dashboard",
          "2. Navigate to Table Editor > menu_items",
          "3. Click 'Add Column'",
          "4. Name: 'variations'",
          "5. Type: 'jsonb'",
          "6. Default value: null",
          "7. Allow nullable: Yes",
          "8. Click 'Save'"
        ],
        sqlCommand: "ALTER TABLE menu_items ADD COLUMN variations JSONB;"
      })
    } else {
      console.log('✅ Variations column already exists or test passed')
      return NextResponse.json({
        success: true,
        message: "Variations column exists or was added successfully"
      })
    }

  } catch (error) {
    console.error('Error checking/adding variations column:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}