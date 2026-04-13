/**
 * Image Upload API — uploads to Supabase Storage
 * Returns a public URL that can be stored in the database
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

const BUCKET_NAME = "new-arrivals-images"
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()

    // Ensure bucket exists (create if not)
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME)

    if (!bucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: allowedTypes,
      })

      if (bucketError && !bucketError.message.includes("already exists")) {
        console.error("Error creating bucket:", bucketError)
        throw bucketError
      }
    }

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileName = `new-arrival-${timestamp}-${randomString}.${ext}`

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error("Storage upload error:", error)
      throw error
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName: fileName,
      path: fileName,
      name: fileName,
    })
  } catch (error) {
    console.error("Upload error:", error)
    const msg = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE method for removing images
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json({ 
        error: 'No filename provided' 
      }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName])

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ 
        error: 'Failed to delete image' 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
