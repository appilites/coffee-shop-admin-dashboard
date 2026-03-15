import { getSupabaseBrowserClient } from "./supabase"

/**
 * Database Table Creation Script
 * Automatically creates all required tables for the coffee shop and admin dashboard
 */

const supabase = getSupabaseBrowserClient()

export async function createDatabaseTables() {
  console.log('🚀 Starting database table creation...')
  
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)

    if (testError) {
      console.error('Database connection test failed:', testError)
      return {
        success: false,
        error: 'Failed to connect to database. Please check your Supabase configuration.'
      }
    }

    // Since we can't use RPC functions, we'll create tables using INSERT operations
    // This is a workaround - the user should ideally run the SQL manually in Supabase dashboard
    
    const tables = [
      'locations',
      'menu_categories', 
      'menu_items',
      'orders',
      'order_items'
    ]

    // Check if tables already exist by trying to query them
    const existingTables = []
    const missingTables = []

    for (const tableName of tables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          if (error.message.includes('does not exist') || error.code === '42P01') {
            missingTables.push(tableName)
          } else {
            console.warn(`Warning checking table ${tableName}:`, error.message)
          }
        } else {
          existingTables.push(tableName)
        }
      } catch (err) {
        missingTables.push(tableName)
      }
    }

    console.log('Existing tables:', existingTables)
    console.log('Missing tables:', missingTables)

    if (missingTables.length === 0) {
      return {
        success: true,
        message: 'All required tables already exist in the database',
        existingTables,
        missingTables: []
      }
    }

    // If tables are missing, provide SQL commands for manual creation
    const sqlCommands = getSQLCommands()
    
    return {
      success: false,
      error: 'Some tables are missing. Please run the SQL commands manually in your Supabase dashboard.',
      existingTables,
      missingTables,
      sqlCommands,
      instructions: [
        '1. Go to your Supabase dashboard',
        '2. Navigate to SQL Editor',
        '3. Copy and run the SQL commands provided',
        '4. Come back and try syncing data'
      ]
    }

  } catch (error) {
    console.error('Error creating database tables:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

function getSQLCommands() {
  return `
-- 1. Create Locations Table
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  opening_time TEXT,
  closing_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Menu Categories Table
CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  parent_id TEXT REFERENCES menu_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES menu_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  prep_time_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Customization Options Table
CREATE TABLE IF NOT EXISTS customization_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id TEXT REFERENCES menu_items(id) ON DELETE CASCADE,
  option_name TEXT NOT NULL,
  option_type TEXT CHECK (option_type IN ('single', 'multiple')) DEFAULT 'single',
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Customization Choices Table
CREATE TABLE IF NOT EXISTS customization_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID REFERENCES customization_options(id) ON DELETE CASCADE,
  choice_name TEXT NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  location_id TEXT REFERENCES locations(id),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  payment_intent_id TEXT,
  pickup_time TIMESTAMP WITH TIME ZONE,
  is_guest_order BOOLEAN DEFAULT true,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  customizations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Combo Options Table (Optional)
CREATE TABLE IF NOT EXISTS combo_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id TEXT REFERENCES menu_items(id),
  name TEXT NOT NULL,
  description TEXT,
  combo_type TEXT CHECK (combo_type IN ('bundle', 'addon', 'quantity')) DEFAULT 'bundle',
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2),
  combo_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create Combo Items Table (Optional)
CREATE TABLE IF NOT EXISTS combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_option_id UUID REFERENCES combo_options(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id),
  quantity INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create Rewards Table (Optional)
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT CHECK (reward_type IN ('free_drink', 'free_tea', 'discount', 'bonus_points')) DEFAULT 'discount',
  discount_percentage DECIMAL(5,2),
  discount_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create Loyalty Points Transactions Table
CREATE TABLE IF NOT EXISTS loyalty_points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID REFERENCES orders(id),
  points INTEGER NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'bonus')) DEFAULT 'earned',
  description TEXT,
  reward_id UUID REFERENCES rewards(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Create User Rewards Table
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reward_id UUID REFERENCES rewards(id),
  order_id UUID REFERENCES orders(id),
  points_spent INTEGER NOT NULL,
  status TEXT CHECK (status IN ('active', 'used', 'expired')) DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`
}