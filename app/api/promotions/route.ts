import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

// GET — list promotions (admin: all; add ?public=1 for shop-style active-only — same query, optional filter)
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const publicOnly = searchParams.get("public") === "1"

    let q = supabase
      .from("promotions")
      .select("*")
      .order("sort_order", { ascending: true })

    if (publicOnly) {
      q = q.eq("is_active", true)
    }

    let { data, error } = await q

    if (error) {
      const msg = error.message || ""
      const missingTable =
        error.code === "42P01" ||
        error.code === "PGRST205" ||
        /relation|does not exist|schema cache/i.test(msg)
      if (missingTable) {
        return NextResponse.json(
          {
            error: "Table promotions not found. Run docs/sql/promotions.sql in Supabase SQL Editor.",
            details: msg,
            code: error.code,
          },
          { status: 503 }
        )
      }
      // RLS / permission / invalid key — return explicit message for the UI
      return NextResponse.json(
        {
          error: "Could not load promotions from database",
          details: msg,
          code: error.code,
          hint: (error as { hint?: string }).hint,
        },
        { status: 500 }
      )
    }

    const productIds = [
      ...new Set(
        (data || [])
          .map((r: { menu_item_id?: string | null }) => r.menu_item_id)
          .filter(Boolean) as string[]
      ),
    ]

    let productMap: Record<string, { id: string; name: string; imageUrl: string | null; basePrice: number }> = {}
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("menu_items")
        .select("id, name, image_url, base_price")
        .in("id", productIds)
      for (const p of products || []) {
        productMap[p.id] = {
          id: p.id,
          name: p.name,
          imageUrl: p.image_url,
          basePrice: p.base_price,
        }
      }
    }

    const rows = (data || []).map((row: Record<string, unknown>) => {
      const mid = row.menu_item_id as string | null
      return {
        id: row.id,
        name: row.name,
        imageUrl: row.image_url,
        description: row.description,
        menuItemId: mid,
        externalUrl: row.external_url,
        isActive: row.is_active,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        product: mid && productMap[mid] ? productMap[mid] : null,
      }
    })

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Promotions GET error:", error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: "Failed to fetch promotions", details: msg },
      { status: 500 }
    )
  }
}

// POST — create promotion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name || "").trim()
    const imageUrl = String(body.imageUrl || "").trim()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    const insert = {
      name,
      image_url: imageUrl,
      description: body.description?.trim() || null,
      menu_item_id: body.menuItemId?.trim() || null,
      external_url: body.externalUrl?.trim() || null,
      is_active: body.isActive !== false,
      sort_order: Math.max(0, Number(body.sortOrder) || 0),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("promotions").insert(insert).select().single()

    if (error) {
      if (error.code === "23503") {
        return NextResponse.json({ error: "Invalid product selected (menu_item_id)" }, { status: 400 })
      }
      throw error
    }

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
    console.error("Promotions POST error:", error)
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to create promotion", details: msg }, { status: 500 })
  }
}
