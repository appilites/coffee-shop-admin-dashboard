import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

// GET - Get single new arrival
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdminClient()
    
    const { data: newArrival, error } = await supabase
      .from('new_arrivals')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error?.code === 'PGRST116' || !newArrival) {
      return NextResponse.json({
        success: false,
        error: "New arrival not found"
      }, { status: 404 })
    }
    
    if (error) throw error
    
    return NextResponse.json(newArrival)
  } catch (error) {
    console.error('Error fetching new arrival:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Update new arrival
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseAdminClient()
    
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.imageUrl !== undefined) updateData.image_url = body.imageUrl || null
    if (body.redirectLink !== undefined) updateData.redirect_link = body.redirectLink || null
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    
    const { data: updatedNewArrival, error } = await supabase
      .from('new_arrivals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error?.code === 'PGRST116') {
      return NextResponse.json({
        success: false,
        error: "New arrival not found"
      }, { status: 404 })
    }
    
    if (error) throw error
    
    return NextResponse.json(updatedNewArrival)
  } catch (error) {
    console.error('Error updating new arrival:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Delete new arrival
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdminClient()
    
    const { error } = await supabase
      .from('new_arrivals')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      message: "New arrival deleted successfully"
    })
  } catch (error) {
    console.error('Error deleting new arrival:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}