"use client"

import { ProductForm } from "@/components/products/product-form"
import { motion } from "framer-motion"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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

interface Product {
  id: string
  name: string
  description: string | null
  base_price: number
  image_url: string | null
  category_id: string
  is_available: boolean
  is_featured: boolean
  prep_time_minutes: number
  created_at: string
  updated_at: string
  loyalty_points_earn?: number
  loyaltyPointsEarn?: number
  variations?: Array<{
    id: string
    title: string
    type: "checkbox" | "radio"
    options: Array<{
      id: string
      label: string
      priceModifier: number
    }>
  }>
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchProductAndCategories()
    }
  }, [params.id])

  const fetchProductAndCategories = async () => {
    try {
      // Fetch product and categories in parallel
      const [productResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/products/${params.id}`),
        fetch('/api/categories')
      ])

      if (!productResponse.ok) {
        throw new Error('Product not found')
      }

      if (!categoriesResponse.ok) {
        throw new Error('Failed to fetch categories')
      }

      const productData = await productResponse.json()
      const categoriesData = await categoriesResponse.json()

      console.log('Product data from API:', productData)
      console.log('Variations in product:', productData.variations)

      setProduct(productData)
      setCategories(categoriesData.filter((c: Category) => c.is_active))
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load product data')
      router.push("/products")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
        <Link href="/products">
          <Button className="mt-4">Back to Products</Button>
        </Link>
      </div>
    )
  }

  // Transform product data to match form expectations (API returns snake_case e.g. image_url)
  const imageUrl = product.image_url ?? (product as { imageUrl?: string | null }).imageUrl ?? null
  const formProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.base_price,
    imageUrl: imageUrl && String(imageUrl).trim() ? String(imageUrl).trim() : null,
    categoryId: product.category_id,
    isAvailable: product.is_available,
    isFeatured: product.is_featured,
    sku: null,
    variations: (product.variations || []).map(v => ({ ...v, required: (v as any).required ?? true })),
    loyaltyPointsEarn: product.loyaltyPointsEarn ?? product.loyalty_points_earn ?? 0,
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
          <h2 className="font-serif text-3xl font-bold text-foreground">Edit Product</h2>
          <p className="text-muted-foreground mt-1">
            Update information for {product.name}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <ProductForm 
          key={product.id}
          product={formProduct} 
          categories={categories} 
        />
      </motion.div>
    </div>
  )
}
