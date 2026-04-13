"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ImageUpload } from "@/components/ui/image-upload"
import { newArrivalSchema, type NewArrivalFormValues, type NewArrival } from "@/lib/validations"

export default function EditNewArrivalPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [fileName, setFileName] = useState<string>("")
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<NewArrivalFormValues>({
    resolver: zodResolver(newArrivalSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      buttonText: "Try Now",
      redirectLink: "/menu",
      isActive: true,
      displayOrder: 0,
    },
  })

  const imageUrl = watch("imageUrl")
  const isActive = watch("isActive")

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
      
      reset({
        title: data.title,
        description: data.description || "",
        imageUrl: data.image_url || "",
        buttonText: "Try Now",
        redirectLink: data.redirect_link || "",
        isActive: data.is_active,
        displayOrder: 0,
      })
    } catch (error) {
      console.error('Error fetching new arrival:', error)
      toast.error('Failed to load new arrival')
    } finally {
      setInitialLoading(false)
    }
  }

  const onSubmit = async (data: NewArrivalFormValues) => {
    if (!resolvedParams?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/new-arrivals/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          fileName: fileName
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update')
      }

      toast.success('New arrival updated successfully')
      router.push('/new-arrivals')
    } catch (error) {
      console.error('Error updating new arrival:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update new arrival')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading new arrival...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/new-arrivals">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Edit New Arrival</h2>
          <p className="text-muted-foreground">Update arrival item details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Arrival Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="e.g., Protein Waffles"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Brief description of the new arrival..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Image Upload Component */}
            <div className="space-y-2">
              <Label>Image</Label>
              <ImageUpload
                value={imageUrl}
                onChange={(url) => setValue("imageUrl", url)}
                onFileNameChange={setFileName}
              />
              {errors.imageUrl && (
                <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
              )}
            </div>

            {/* Redirect Link */}
            <div className="space-y-2">
              <Label htmlFor="redirectLink">Button Link (Try Now)</Label>
              <div className="space-y-2">
                <select 
                  className="w-full p-2 border rounded-md text-sm"
                  onChange={(e) => {
                    if (e.target.value) {
                      setValue("redirectLink", e.target.value)
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">Select a quick link or enter custom below</option>
                  <optgroup label="Menu Categories">
                    <option value="/menu?category=beverages">Beverages</option>
                    <option value="/menu?category=coffee">Coffee</option>
                    <option value="/menu?category=tea">Tea</option>
                    <option value="/menu?category=smoothies">Smoothies</option>
                    <option value="/menu?category=waffles">Waffles</option>
                    <option value="/menu?category=pastries">Pastries</option>
                    <option value="/menu?category=specialty-drinks">Specialty Drinks</option>
                    <option value="/menu?category=beauty-drinks">Beauty Drinks</option>
                    <option value="/menu?category=meal-replacement-shakes">Meal Replacement Shakes</option>
                    <option value="/menu?category=kid-drinks">Kid Drinks</option>
                  </optgroup>
                  <optgroup label="General Pages">
                    <option value="/menu">Full Menu</option>
                    <option value="/products">All Products</option>
                    <option value="/categories">Categories</option>
                  </optgroup>
                </select>
                <Input
                  id="redirectLink"
                  {...register("redirectLink")}
                  placeholder="/menu?category=waffles or /products/123 or https://example.com"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Where users will go when they click "Try Now" button. Examples:
                <br />• /menu?category=beverages (category page)
                <br />• /products/product-id (specific product)
                <br />• https://external-link.com (external site)
              </p>
              {errors.redirectLink && (
                <p className="text-sm text-destructive">{errors.redirectLink.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update New Arrival
              </Button>
              <Link href="/new-arrivals">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}