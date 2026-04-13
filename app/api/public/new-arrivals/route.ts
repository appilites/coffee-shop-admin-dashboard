import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

// GET - Public API for coffee shop to fetch active new arrivals
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    
    const { data: newArrivals, error } = await supabase
      .from('new_arrivals')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (error) throw error
    
    // Transform data for coffee shop
    const transformedData = newArrivals?.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url,
      buttonText: item.button_text,
      redirectLink: item.redirect_link,
      displayOrder: item.display_order
    })) || []
    
    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    })
    
  } catch (error) {
    console.error('Error fetching public new arrivals:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }, { status: 500 })
  }
}