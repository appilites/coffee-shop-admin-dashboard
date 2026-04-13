import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

// GET - List all new arrivals
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    
    const { data: newArrivals, error } = await supabase
      .from('new_arrivals')
      .select('*')
      .order('display_order', { ascending: true })
    
    if (error) throw error
    
    return NextResponse.json(newArrivals || [])
  } catch (error) {
    console.error('Error fetching new arrivals:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Create new arrival
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getSupabaseAdminClient()
    
    // Validate required fields
    if (!body.title || !body.redirectLink) {
      return NextResponse.json({
        success: false,
        error: "Title and button link are required"
      }, { status: 400 })
    }
    
    const insertData = {
      title: body.title,
      description: body.description || null,
      image_url: body.imageUrl || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&crop=center",
      button_text: body.buttonText || "Try Now",
      redirect_link: body.redirectLink,
      is_active: body.isActive !== undefined ? body.isActive : true,
      display_order: body.displayOrder || Math.floor(Date.now() / 1000) // Use timestamp for auto-ordering
    }
    
    const { data: newArrival, error } = await supabase
      .from('new_arrivals')
      .insert(insertData)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(newArrival, { status: 201 })
  } catch (error) {
    console.error('Error creating new arrival:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}