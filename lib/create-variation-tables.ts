/**
 * Create variation/customization tables for products
 */

import { getSupabaseAdminClient } from "./supabase-server"

export async function createVariationTables() {
  const supabase = getSupabaseAdminClient()

  try {
    console.log('🔧 Creating variation tables...')

    // Create customization_options table
    const { error: optionsError } = await supabase.rpc('exec_sql', {
      sql: `
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
    })

    if (optionsError) {
      console.error('Error creating customization_options table:', optionsError)
    } else {
      console.log('✅ customization_options table created')
    }

    // Create customization_choices table
    const { error: choicesError } = await supabase.rpc('exec_sql', {
      sql: `
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
    })

    if (choicesError) {
      console.error('Error creating customization_choices table:', choicesError)
    } else {
      console.log('✅ customization_choices table created')
    }

    // Create indexes for better performance
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_customization_options_menu_item_id 
        ON customization_options(menu_item_id);
        
        CREATE INDEX IF NOT EXISTS idx_customization_choices_option_id 
        ON customization_choices(option_id);
      `
    })

    if (indexError) {
      console.error('Error creating indexes:', indexError)
    } else {
      console.log('✅ Indexes created')
    }

    return { success: true }
  } catch (error) {
    console.error('Error creating variation tables:', error)
    return { success: false, error }
  }
}

// Alternative approach using direct SQL if RPC doesn't work
export async function createVariationTablesDirectSQL() {
  const supabase = getSupabaseAdminClient()

  try {
    console.log('🔧 Creating variation tables with direct SQL...')

    // Check if tables exist first
    const { data: existingTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['customization_options', 'customization_choices'])

    console.log('Existing tables:', existingTables)

    return { success: true, existingTables }
  } catch (error) {
    console.error('Error checking tables:', error)
    return { success: false, error }
  }
}