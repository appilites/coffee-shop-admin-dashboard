"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Loader2, AlertCircle, ArrowLeft, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface MigrationResult {
  success: boolean
  message: string
  details?: {
    inserted: number
    updated: number
    total: number
    images: Array<{ title: string; image: string }>
  }
}

export default function MigrateImagesPage() {
  const [migrating, setMigrating] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)

  const migrateImages = async () => {
    setMigrating(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/setup/migrate-existing-images', {
        method: 'POST'
      })
      
      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        toast.success('Images migrated successfully!')
      } else {
        toast.error('Migration failed: ' + data.error)
      }
    } catch (error) {
      console.error('Migration error:', error)
      toast.error('Migration failed')
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/new-arrivals">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Migrate Existing Images</h2>
          <p className="text-muted-foreground mt-1">
            Save your current shop images to database for dashboard management
          </p>
        </div>
      </div>

      {/* Migration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Migration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">What will be migrated?</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Your existing New Arrivals images from the shop</p>
              <p>• Image paths: /newarrival.jfif, /newarrival1.jfif, /newarrival2.jfif</p>
              <p>• Additional coffee shop images and content</p>
              <p>• All images will be saved to database for dashboard management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={migrateImages}
              disabled={migrating || (result?.success === true)}
              className="gap-2"
            >
              {migrating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Migrating Images...
                </>
              ) : result?.success ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Migration Complete
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  Start Migration
                </>
              )}
            </Button>
            
            {result?.success && (
              <Link href="/new-arrivals">
                <Button variant="outline">
                  View New Arrivals Dashboard
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Migration Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>
              
              {result.success && result.details && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {result.details.inserted}
                      </div>
                      <div className="text-sm text-green-700">New Items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.details.updated}
                      </div>
                      <div className="text-sm text-blue-700">Updated Items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {result.details.total}
                      </div>
                      <div className="text-sm text-purple-700">Total Items</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">Migrated Images:</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.details.images.map((img, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {img.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>After Migration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5">
              1
            </div>
            <div>
              <h4 className="font-medium">Dashboard Management</h4>
              <p className="text-sm text-muted-foreground">
                Go to New Arrivals dashboard to edit, add, or remove items
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5">
              2
            </div>
            <div>
              <h4 className="font-medium">Shop Integration</h4>
              <p className="text-sm text-muted-foreground">
                Your shop will automatically use data from database via API
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5">
              3
            </div>
            <div>
              <h4 className="font-medium">Image Upload</h4>
              <p className="text-sm text-muted-foreground">
                Upload new images or continue using existing ones from public folder
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}