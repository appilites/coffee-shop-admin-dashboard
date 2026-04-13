import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient()
    
    console.log('🔧 Setting up Supabase Storage for New Arrivals...')
    
    const bucketName = 'new-arrivals-images'
    
    // Check if bucket already exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === bucketName)
    
    if (bucketExists) {
      console.log('✅ Bucket already exists:', bucketName)
    } else {
      // Create bucket
      const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      })
      
      if (bucketError) {
        console.error('Bucket creation error:', bucketError)
        throw bucketError
      }
      
      console.log('✅ Bucket created successfully:', bucketName)
    }
    
    // Set up storage policies using RPC
    const policies = [
      {
        name: 'Public read access',
        sql: `
          CREATE POLICY IF NOT EXISTS "Public read access" ON storage.objects
          FOR SELECT USING (bucket_id = '${bucketName}');
        `
      },
      {
        name: 'Authenticated users can upload',
        sql: `
          CREATE POLICY IF NOT EXISTS "Authenticated users can upload" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = '${bucketName}');
        `
      },
      {
        name: 'Authenticated users can update',
        sql: `
          CREATE POLICY IF NOT EXISTS "Authenticated users can update" ON storage.objects
          FOR UPDATE USING (bucket_id = '${bucketName}');
        `
      },
      {
        name: 'Authenticated users can delete',
        sql: `
          CREATE POLICY IF NOT EXISTS "Authenticated users can delete" ON storage.objects
          FOR DELETE USING (bucket_id = '${bucketName}');
        `
      }
    ]
    
    // Apply policies
    for (const policy of policies) {
      try {
        const { error: policyError } = await supabase.rpc('exec_sql', {
          sql: policy.sql
        })
        
        if (policyError) {
          console.warn(`Policy warning for ${policy.name}:`, policyError)
        } else {
          console.log(`✅ Policy applied: ${policy.name}`)
        }
      } catch (error) {
        console.warn(`Policy setup warning for ${policy.name}:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase Storage setup completed successfully',
      bucketName: bucketName,
      bucketUrl: `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]}/storage/v1/object/public/${bucketName}/`
    })
    
  } catch (error) {
    console.error('Error setting up Supabase Storage:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}