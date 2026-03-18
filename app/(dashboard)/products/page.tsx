"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Grid3x3, Table2, Search, Filter, Loader2 } from "lucide-react"
import { ProductGrid } from "@/components/products/product-grid"
import { ProductsTable } from "@/components/products/products-table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"

type ViewMode = "grid" | "table"

interface Product {
  id: string
  name: string
  description: string | null
  base_price: number
  image_url: string | null
  category_id: string | null
  is_available: boolean
  is_featured: boolean
  prep_time_minutes: number
  created_at: string
  updated_at: string
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
  category?: {
    id: string
    name: string
    parent_id?: string | null
  }
  categoryPath?: string
}

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

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 35

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  // Auto-refresh every 30 seconds to catch new products
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now()
      
      // Fetch products and categories in parallel
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/products?t=${timestamp}`),
        fetch(`/api/categories?t=${timestamp}`)
      ])

      if (!productsResponse.ok) {
        let errorBody: any = null
        try {
          errorBody = await productsResponse.json()
        } catch {
          // ignore JSON parse error
        }
        console.error('Products API Error:', productsResponse.status, productsResponse.statusText, errorBody)
        throw new Error(`Products API returned ${productsResponse.status}`)
      }
      if (!categoriesResponse.ok) {
        console.error('Categories API Error:', categoriesResponse.status, categoriesResponse.statusText)
        throw new Error(`Categories API returned ${categoriesResponse.status}`)
      }

      const productsData = await productsResponse.json()
      const categoriesData = await categoriesResponse.json()

      console.log('Fetched products:', productsData?.length || 0, productsData)
      console.log('Fetched categories:', categoriesData?.length || 0)

      setProducts(Array.isArray(productsData) ? productsData : [])
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  // Create category hierarchy map for better display
  const categoryMap = new Map<string, Category>()
  categories.forEach(cat => categoryMap.set(cat.id, cat))
  
  // Function to get full category path (Main > Sub)
  const getCategoryPath = (categoryId: string | null): string => {
    if (!categoryId) return 'Uncategorized'
    
    const category = categoryMap.get(categoryId)
    if (!category) return 'Unknown Category'
    
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id)
      if (parent) {
        return `${parent.name} > ${category.name}`
      }
    }
    
    return category.name
  }

  // Get organized categories for filter dropdown
  const organizedCategories = () => {
    const parentCategories = categories.filter(c => !c.parent_id && c.is_active)
    const result: Array<{ id: string; name: string; isParent: boolean }> = []
    
    parentCategories.forEach(parent => {
      result.push({ id: parent.id, name: parent.name, isParent: true })
      
      const children = categories.filter(c => c.parent_id === parent.id && c.is_active)
      children.forEach(child => {
        result.push({ 
          id: child.id, 
          name: `${parent.name} > ${child.name}`, 
          isParent: false 
        })
      })
    })
    
    return result
  }

  // Transform products to match the expected format with full category path
  const transformedProducts = products.map(product => {
    const category = product.category || categories.find(c => c.id === product.category_id)
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.base_price,
      imageUrl: product.image_url || `/coffee-drink.png`, // Use local default image
      categoryId: product.category_id || 'uncategorized',
      isAvailable: product.is_available,
      isFeatured: product.is_featured,
      sku: null, // Add SKU field to database if needed
      variations: product.variations || [], // Pass variations from API
      category: {
        name: category?.name || 'Uncategorized',
        emoji: '📦',
        parent_id: category?.parent_id
      },
      categoryPath: getCategoryPath(product.category_id),
      createdAt: new Date(product.created_at)
    }
  })
  // Filter products with enhanced category matching
  const filteredProducts = transformedProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.categoryPath.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || 
      product.categoryId === selectedCategory ||
      // Also match if searching by parent category and product is in a subcategory
      (product.category?.parent_id === selectedCategory)

    return matchesSearch && matchesCategory
  })

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Products</h2>
          <p className="text-muted-foreground mt-1">
            Manage your coffee shop products and inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchData}
            disabled={loading}
            className="shadow-soft"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Link href="/products/new">
            <Button className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Card className="border-border/40 shadow-soft">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products by name or description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-9 bg-background border-border/60"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[200px] bg-background border-border/60">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {organizedCategories().map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className={category.isParent ? "font-medium" : "text-muted-foreground"}>
                          {category.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 border-l border-border/40 pl-4">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                >
                  <Table2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of{" "}
                {filteredProducts.length} products
              </span>
              {selectedCategory !== "all" && (
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  {organizedCategories().find((c) => c.id === selectedCategory)?.name || 
                   categories.find((c) => c.id === selectedCategory)?.name}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Products Display */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {filteredProducts.length === 0 ? (
          <Card className="border-border/40 shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                No products found
              </h3>
              <p className="text-muted-foreground text-center">
                {products.length === 0 
                  ? "No products have been added yet. Click 'Add Product' to get started."
                  : "Try adjusting your search or filter criteria"
                }
              </p>
              {products.length === 0 && (
                <Link href="/products/new" className="mt-4">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <ProductGrid products={paginatedProducts} onProductDeleted={fetchData} />
        ) : (
          <ProductsTable products={paginatedProducts} onProductDeleted={fetchData} />
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex items-center justify-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="border-border/60"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={
                      currentPage === page
                        ? ""
                        : "border-border/60"
                    }
                  >
                    {page}
                  </Button>
                )
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-2 text-muted-foreground">...</span>
              }
              return null
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="border-border/60"
          >
            Next
          </Button>
        </motion.div>
      )}
    </div>
  )
}
