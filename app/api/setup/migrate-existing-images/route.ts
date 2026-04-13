import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient()
    
    console.log('🔄 Migrating existing shop images to database...')
    
    // Your existing shop images that are currently showing on cards
    // Using placeholder images since original files don't exist
    const existingImages = [
      {
        title: 'Protein Waffles',
        description: 'Build your own protein-packed waffle with your favorite toppings',
        image_url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&h=300&fit=crop&crop=center',
        button_text: 'Try Now',
        redirect_link: '/menu?category=waffles',
        display_order: 1,
        is_active: true
      },
      {
        title: 'Oat Milk Chai Tea Latte',
        description: 'Slow sips, sweet moments. Protein-packed chai tea latte with oat milk',
        image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
        button_text: 'Order Now',
        redirect_link: '/menu?category=beverages',
        display_order: 2,
        is_active: true
      },
      {
        title: 'Specialty Drinks Collection',
        description: 'Explore our premium specialty drink collection with unique flavors',
        image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop&crop=center',
        button_text: 'Explore Menu',
        redirect_link: '/menu?category=specialty-drinks',
        display_order: 3,
        is_active: true
      },
      {
        title: 'Fresh Coffee Blends',
        description: 'Discover our signature coffee blends made from premium beans',
        image_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop&crop=center',
        button_text: 'Shop Coffee',
        redirect_link: '/menu?category=coffee',
        display_order: 4,
        is_active: true
      },
      {
        title: 'Healthy Smoothie Bowls',
        description: 'Nutritious and delicious smoothie bowls packed with superfoods',
        image_url: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=300&fit=crop&crop=center',
        button_text: 'Order Bowl',
        redirect_link: '/menu?category=smoothies',
        display_order: 5,
        is_active: true
      },
      {
        title: 'Artisan Pastries',
        description: 'Freshly baked pastries and desserts made daily in our kitchen',
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop&crop=center',
        button_text: 'View Pastries',
        redirect_link: '/menu?category=pastries',
        display_order: 6,
        is_active: true
      }
    ]
    
    // Check if table exists and has data
    const { data: existingData, error: checkError } = await supabase
      .from('new_arrivals')
      .select('id, title')
      .limit(1)
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }
    
    let insertedCount = 0
    let updatedCount = 0
    
    // Insert or update each image
    for (const imageData of existingImages) {
      try {
        // Check if item with same title already exists
        const { data: existing } = await supabase
          .from('new_arrivals')
          .select('id, title')
          .eq('title', imageData.title)
          .single()
        
        if (existing) {
          // Update existing item
          const { error: updateError } = await supabase
            .from('new_arrivals')
            .update({
              ...imageData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
          
          if (updateError) {
            console.warn(`Update warning for ${imageData.title}:`, updateError)
          } else {
            updatedCount++
            console.log(`✅ Updated: ${imageData.title}`)
          }
        } else {
          // Insert new item
          const { error: insertError } = await supabase
            .from('new_arrivals')
            .insert(imageData)
          
          if (insertError) {
            console.warn(`Insert warning for ${imageData.title}:`, insertError)
          } else {
            insertedCount++
            console.log(`✅ Inserted: ${imageData.title}`)
          }
        }
      } catch (error) {
        console.warn(`Error processing ${imageData.title}:`, error)
      }
    }
    
    console.log(`🎉 Migration completed: ${insertedCount} inserted, ${updatedCount} updated`)
    
    // Get final count
    const { data: finalData, error: countError } = await supabase
      .from('new_arrivals')
      .select('id')
    
    const totalCount = finalData?.length || 0
    
    return NextResponse.json({
      success: true,
      message: `Successfully migrated existing images to database`,
      details: {
        inserted: insertedCount,
        updated: updatedCount,
        total: totalCount,
        images: existingImages.map(img => ({
          title: img.title,
          image: img.image_url
        }))
      }
    })
    
  } catch (error) {
    console.error('Error migrating existing images:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}