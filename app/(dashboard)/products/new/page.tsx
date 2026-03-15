"use client"

import { useState, useEffect } from "react"
import { ProductForm } from "@/components/products/product-form"
import { motion } from "framer-motion"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"

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

export default function NewProductPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      console.log('Fetched categories:', data)
      console.log('First category structure:', data[0])
      
      if (!data || data.length === 0) {
        toast.error('No categories found. Please sync coffee shop data first.')
        setCategories([])
      } else {
        const activeCategories = data.filter((c: Category) => c.is_active)
        console.log('Active categories:', activeCategories)
        setCategories(activeCategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories. Please check your connection and sync data.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-4"
      >
        <Link href="/products">
          <Button variant="ghost" size="icon" className="h-9 w-9 border-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Add Product</h2>
          <p className="text-muted-foreground mt-1">
            Create a new product for your coffee shop
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No categories found. You need to sync coffee shop data first.
            </p>
            <div className="space-y-2">
              <Link href="/settings">
                <Button>Go to Settings & Sync Data</Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                Or create categories manually first
              </p>
              <Link href="/categories/new">
                <Button variant="outline">Create Category</Button>
              </Link>
            </div>
          </div>
        ) : categories.some(c => !c.name) ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Categories found but some have missing names. Please re-sync data.
            </p>
            <div className="space-y-2">
              <Link href="/settings">
                <Button>Go to Settings & Re-sync Data</Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                Categories: {categories.length} found, {categories.filter(c => !c.name).length} with missing names
              </p>
            </div>
          </div>
        ) : (
          <ProductForm categories={categories} />
        )}
      </motion.div>
    </div>
  )
}
