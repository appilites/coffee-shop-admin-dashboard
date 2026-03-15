import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient()
    
    console.log('🚀 Creating variation tables...')

    // Create customization_options table
    const createOptionsTable = `
      CREATE TABLE IF NOT EXISTS customization_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
        option_name VARCHAR(255) NOT NULL,
        option_type VARCHAR(50) NOT NULL CHECK (option_type IN ('single', 'multiple')),
        display_order INTEGER DEFAULT 0,
        is_required BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create customization_choices table
    const createChoicesTable = `
      CREATE TABLE IF NOT EXISTS customization_choices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        option_id UUID NOT NULL REFERENCES customization_options(id) ON DELETE CASCADE,
        choice_name VARCHAR(255) NOT NULL,
        price_modifier DECIMAL(10,2) DEFAULT 0.00,
        display_order INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_customization_options_menu_item_id 
      ON customization_options(menu_item_id);
      
      CREATE INDEX IF NOT EXISTS idx_customization_choices_option_id 
      ON customization_choices(option_id);
    `

    // Execute the SQL commands
    const { error: optionsError } = await supabase.rpc('exec_sql', {
      sql: createOptionsTable
    })

    if (optionsError) {
      console.error('Error creating options table:', optionsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create options table',
        details: optionsError 
      }, { status: 500 })
    }

    const { error: choicesError } = await supabase.rpc('exec_sql', {
      sql: createChoicesTable
    })

    if (choicesError) {
      console.error('Error creating choices table:', choicesError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create choices table',
        details: choicesError 
      }, { status: 500 })
    }

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: createIndexes
    })

    if (indexError) {
      console.error('Error creating indexes:', indexError)
      // Don't fail for index errors
    }

    console.log('✅ Variation tables created successfully')

    return NextResponse.json({
      success: true,
      message: "Variation tables created successfully"
    })

  } catch (error) {
    console.error('Error setting up variations:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}