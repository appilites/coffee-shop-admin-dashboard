"use client"

import { useState } from "react"
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
import { newArrivalSchema, type NewArrivalFormValues } from "@/lib/validations"

export default function NewNewArrivalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string>("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<NewArrivalFormValues>({
    resolver: zodResolver(newArrivalSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      buttonText: "Try Now",
      redirectLink: "",
      isActive: true,
      displayOrder: 0,
    },
  })

  const imageUrl = watch("imageUrl")
  const isActive = watch("isActive")

  const onSubmit = async (data: NewArrivalFormValues) => {
    setLoading(true)
    try {
      const response = await fetch('/api/new-arrivals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          fileName: fileName // Store filename for future deletion
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create')
      }

      toast.success('New arrival created successfully')
      router.push('/new-arrivals')
    } catch (error) {
      console.error('Error creating new arrival:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create new arrival')
    } finally {
      setLoading(false)
    }
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
          <h2 className="font-serif text-3xl font-bold text-foreground">Add New Arrival</h2>
          <p className="text-muted-foreground">Create a new arrival item for your homepage</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Arrival Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
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
                <Label htmlFor="buttonText">
                  Button Text <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="buttonText"
                  {...register("buttonText")}
                  placeholder="e.g., Try Now"
                />
                {errors.buttonText && (
                  <p className="text-sm text-destructive">{errors.buttonText.message}</p>
                )}
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="redirectLink">Redirect Link</Label>
              <Input
                id="redirectLink"
                {...register("redirectLink")}
                placeholder="/menu?category=cat-example or https://example.com"
              />
              <p className="text-xs text-muted-foreground">
                Where users will go when they click the button
              </p>
              {errors.redirectLink && (
                <p className="text-sm text-destructive">{errors.redirectLink.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  {...register("displayOrder", { valueAsNumber: true })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first
                </p>
                {errors.displayOrder && (
                  <p className="text-sm text-destructive">{errors.displayOrder.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create New Arrival
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