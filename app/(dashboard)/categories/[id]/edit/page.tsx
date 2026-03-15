"use client"

/**
 * Edit Category Page
 */

import { useState, useEffect } from "react"
import { CategoryForm } from "@/components/categories/category-form"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"

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

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundError, setNotFoundError] = useState(false)

  useEffect(() => {
    fetchCategory()
  }, [params.id])

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/categories/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setNotFoundError(true)
        }
        throw new Error('Failed to fetch category')
      }
      const categoryData = await response.json()
      setCategory(categoryData)
    } catch (error) {
      console.error('Error fetching category:', error)
      setNotFoundError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading category...</p>
        </div>
      </div>
    )
  }

  if (notFoundError || !category) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Category</h1>
        <p className="text-muted-foreground">Update category information</p>
      </div>

      <CategoryForm category={category} />
    </div>
  )
}
