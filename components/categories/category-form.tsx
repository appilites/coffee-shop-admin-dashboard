"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { categorySchema, type CategoryFormValues } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Category {
  id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
  parent_id: string | null
  created_at: string
  updated_at: string
  parent?: {
    id: string
    name: string
  } | null
}

interface CategoryFormProps {
  category?: Category
  onSuccess?: () => void
  onCancel?: () => void
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          description: category.description || "",
          isActive: category.is_active,
          parentId: category.parent_id,
        }
      : {
          isActive: true,
          parentId: null,
        },
  })

  const name = watch("name")
  const parentId = watch("parentId")

  // Debug: Log the current form values
  console.log('Current form values:', { name, parentId, category })

  // Fetch categories for parent selection
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          // Filter out current category and its descendants to prevent circular references
          const availableCategories = data.filter((cat: Category) => {
            if (category && cat.id === category.id) return false
            if (category && cat.parent_id === category.id) return false
            return true
          })
          setCategories(availableCategories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [category])

  // Auto-generate slug from name (not used in database but kept for form validation)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setValue("name", value)
  }

  const onSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true)

    try {
      const categoryData = {
        name: data.name,
        description: data.description || null,
        isActive: data.isActive,
        parentId: data.parentId || null,
      }

      console.log('Submitting category data:', categoryData)

      const url = category ? `/api/categories/${category.id}` : '/api/categories'
      const method = category ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save category')
      }

      const result = await response.json()
      console.log('Category saved successfully:', result)
      
      toast.success(category ? "Category updated successfully" : "Category created successfully")
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/categories")
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Category Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register("name")}
          onChange={handleNameChange}
          placeholder="e.g., Coffee, Tea, Protein"
          disabled={isSubmitting}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Category description..."
          rows={3}
          disabled={isSubmitting}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentId">Parent Category</Label>
        <Select
          value={parentId || "none"}
          onValueChange={(value) => {
            console.log('Parent category changed to:', value)
            setValue("parentId", value === "none" ? null : value)
          }}
          disabled={isSubmitting || loadingCategories}
        >
          <SelectTrigger id="parentId" className="w-full bg-white border-border/60">
            <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select parent category (optional)"} />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="none">No Parent (Top Level)</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose a parent category to create a subcategory, or leave empty for a top-level category.
        </p>
        {errors.parentId && (
          <p className="text-sm text-destructive">{errors.parentId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="isActive">Status</Label>
        <Select
          value={watch("isActive") ? "active" : "inactive"}
          onValueChange={(value) => setValue("isActive", value === "active")}
          disabled={isSubmitting}
        >
          <SelectTrigger id="isActive" className="w-full bg-white border-border/60">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Inactive categories will be hidden from the shop.
        </p>
      </div>

      <div className="flex gap-4 justify-end pt-4">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            category ? "Update Category" : "Create Category"
          )}
        </Button>
      </div>
    </form>
  )
}
