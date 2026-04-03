import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

// PUT — update promotion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await getSupabaseServerClient()

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) update.name = String(body.name).trim()
    if (body.imageUrl !== undefined) update.image_url = String(body.imageUrl).trim()
    if (body.description !== undefined)
      update.description =
        body.description === null || body.description === "" ? null : String(body.description).trim()
    if (body.menuItemId !== undefined)
      update.menu_item_id =
        body.menuItemId === null || body.menuItemId === ""
          ? null
          : String(body.menuItemId).trim()
    if (body.externalUrl !== undefined)
      update.external_url =
        body.externalUrl === null || body.externalUrl === ""
          ? null
          : String(body.externalUrl).trim()
    if (body.isActive !== undefined) update.is_active = Boolean(body.isActive)
    if (body.sortOrder !== undefined) update.sort_order = Math.max(0, Number(body.sortOrder) || 0)

    const { data, error } = await supabase.from("promotions").update(update).eq("id", id).select().single()

    if (error?.code === "PGRST116") {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 })
    }
    if (error?.code === "23503") {
      return NextResponse.json({ error: "Invalid product (menu_item_id)" }, { status: 400 })
    }
    if (error) throw error

    return NextResponse.json({
      id: data.id,
      name: data.name,
      imageUrl: data.image_url,
      description: data.description,
      menuItemId: data.menu_item_id,
      externalUrl: data.external_url,
      isActive: data.is_active,
      sortOrder: data.sort_order,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    })
  } catch (error) {
    console.error("Promotions PUT error:", error)
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to update promotion", details: msg }, { status: 500 })
  }
}

// DELETE
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.from("promotions").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Promotions DELETE error:", error)
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to delete promotion", details: msg }, { status: 500 })
  }
}
