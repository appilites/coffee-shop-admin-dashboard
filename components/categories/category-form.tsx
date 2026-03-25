"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { categorySchema, type CategoryFormValues } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
}

interface CategoryFormProps {
  category?: Category
  onSuccess?: () => void
  onCancel?: () => void
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const onSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true)
    try {
      const categoryData = {
        name: data.name,
        description: data.description || null,
        isActive: data.isActive,
        // preserve existing parentId on edit; null on create (parent-only form)
        parentId: category ? data.parentId ?? null : null,
      }

      const url = category ? `/api/categories/${category.id}` : '/api/categories'
      const method = category ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save category')
      }

      toast.success(category ? "Category updated successfully" : "Category created successfully")
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/categories")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
    else router.back()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register("name")}
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
          placeholder="Optional description..."
          rows={3}
          disabled={isSubmitting}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
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

      <div className="flex gap-3 justify-end pt-2">
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
            category ? "Update" : "Create Category"
          )}
        </Button>
      </div>
    </form>
  )
}
