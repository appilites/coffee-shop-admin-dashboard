import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient()
    
    console.log('🔧 Creating new_arrivals table...')
    
    // Create new_arrivals table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- New Arrivals Table
        CREATE TABLE IF NOT EXISTS new_arrivals (
          id TEXT PRIMARY KEY DEFAULT ('arrival-' || extract(epoch from now()) || '-' || substr(md5(random()::text), 1, 8)),
          title TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          button_text TEXT DEFAULT 'Try Now',
          redirect_link TEXT,
          is_active BOOLEAN DEFAULT true,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Index for better performance
        CREATE INDEX IF NOT EXISTS idx_new_arrivals_active ON new_arrivals(is_active, display_order);
        
        -- Trigger for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        DROP TRIGGER IF EXISTS update_new_arrivals_updated_at ON new_arrivals;
        CREATE TRIGGER update_new_arrivals_updated_at
          BEFORE UPDATE ON new_arrivals
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `
    })
    
    if (tableError) {
      console.error('Table creation error:', tableError)
      throw tableError
    }
    
    console.log('✅ new_arrivals table created successfully')
    
    // Insert sample data
    const { error: insertError } = await supabase
      .from('new_arrivals')
      .insert([
        {
          title: 'Protein Waffles',
          description: 'Build your own protein-packed waffle with your favorite toppings',
          image_url: '/newarrival.jfif',
          button_text: 'Try Now',
          redirect_link: '/menu?category=cat-17',
          display_order: 1
        },
        {
          title: 'Oat Milk Chai Tea Latte',
          description: 'Slow sips, sweet moments. Protein-packed chai tea latte with oat milk',
          image_url: '/newarrival1.jfif',
          button_text: 'Try Now',
          redirect_link: '/menu?category=cat-16',
          display_order: 2
        },
        {
          title: 'Specialty Drinks',
          description: 'Explore our premium specialty drink collection with unique flavors',
          image_url: '/newarrival2.jfif',
          button_text: 'Try Now',
          redirect_link: '/menu?category=cat-specialty-drinks',
          display_order: 3
        }
      ])
    
    if (insertError) {
      console.warn('Sample data insertion warning:', insertError)
    } else {
      console.log('✅ Sample data inserted successfully')
    }
    
    return NextResponse.json({
      success: true,
      message: 'New arrivals table created successfully with sample data'
    })
    
  } catch (error) {
    console.error('Error creating new arrivals table:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}