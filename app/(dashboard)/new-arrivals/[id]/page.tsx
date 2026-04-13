"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { NewArrival } from "@/lib/validations"

export default function ViewNewArrivalPage({ params }: { params: Promise<{ id: string }> }) {
  const [newArrival, setNewArrival] = useState<NewArrival | null>(null)
  const [loading, setLoading] = useState(true)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (resolvedParams?.id) {
      fetchNewArrival()
    }
  }, [resolvedParams])

  const fetchNewArrival = async () => {
    if (!resolvedParams?.id) return

    try {
      const response = await fetch(`/api/new-arrivals/${resolvedParams.id}`)
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data: NewArrival = await response.json()
      setNewArrival(data)
    } catch (error) {
      console.error('Error fetching new arrival:', error)
      toast.error('Failed to load new arrival')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading new arrival...</p>
        </div>
      </div>
    )
  }

  if (!newArrival) {
    return (
      <div className="text-center py-12">
        <h3 className="font-semibold text-lg mb-2">New arrival not found</h3>
        <p className="text-muted-foreground mb-4">The requested new arrival could not be found.</p>
        <Link href="/new-arrivals">
          <Button>Back to New Arrivals</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/new-arrivals">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="font-serif text-3xl font-bold text-foreground">{newArrival.title}</h2>
            <p className="text-muted-foreground">New arrival details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={newArrival.is_active ? "default" : "secondary"}>
            {newArrival.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Link href={`/new-arrivals/${newArrival.id}/edit`}>
            <Button className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image */}
        {newArrival.image_url && (
          <Card>
            <CardHeader>
              <CardTitle>Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video relative rounded-lg overflow-hidden">
                <img
                  src={newArrival.image_url}
                  alt={newArrival.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Title</h4>
              <p className="text-lg font-semibold">{newArrival.title}</p>
            </div>

            {newArrival.description && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{newArrival.description}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Button Text</h4>
              <p className="text-sm">{newArrival.button_text}</p>
            </div>

            {newArrival.redirect_link && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Redirect Link</h4>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">
                    {newArrival.redirect_link}
                  </p>
                  {newArrival.redirect_link.startsWith('http') ? (
                    <a 
                      href={newArrival.redirect_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  ) : (
                    <Link href={newArrival.redirect_link}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Display Order</h4>
                <p className="text-sm">{newArrival.display_order}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
                <Badge variant={newArrival.is_active ? "default" : "secondary"}>
                  {newArrival.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <h4 className="font-medium mb-1">Created</h4>
                <p>{new Date(newArrival.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Updated</h4>
                <p>{new Date(newArrival.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-gradient-to-br from-background to-muted/20">
            <div className="max-w-sm mx-auto">
              {newArrival.image_url && (
                <div className="aspect-video mb-4 rounded-lg overflow-hidden">
                  <img
                    src={newArrival.image_url}
                    alt={newArrival.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="text-xl font-semibold mb-2">{newArrival.title}</h3>
              {newArrival.description && (
                <p className="text-muted-foreground mb-4 text-sm">{newArrival.description}</p>
              )}
              <Button className="w-full">
                {newArrival.button_text}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}