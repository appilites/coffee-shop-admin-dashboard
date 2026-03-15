"use client"

import { motion } from "framer-motion"
import { ChevronLeft, Edit, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
    parent?: {
      id: string
      name: string
    } | null
  }
}

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  // Calculate total price based on selected variations
  const calculateTotalPrice = () => {
    if (!product) return 0
    
    let totalPrice = product.base_price
    
    product.variations?.forEach(variation => {
      const selectedOptionIds = selectedOptions[variation.id] || []
      selectedOptionIds.forEach(optionId => {
        const option = variation.options.find(opt => opt.id === optionId)
        if (option) {
          totalPrice += option.priceModifier
        }
      })
    })
    
    return totalPrice
  }

  // Handle option selection
  const handleOptionSelect = (variationId: string, optionId: string, variationType: "radio" | "checkbox") => {
    setSelectedOptions(prev => {
      const newSelected = { ...prev }
      
      if (variationType === "radio") {
        // For radio buttons, only one option can be selected
        newSelected[variationId] = [optionId]
      } else {
        // For checkboxes, multiple options can be selected
        const currentSelected = newSelected[variationId] || []
        if (currentSelected.includes(optionId)) {
          // Remove if already selected
          newSelected[variationId] = currentSelected.filter(id => id !== optionId)
        } else {
          // Add to selection
          newSelected[variationId] = [...currentSelected, optionId]
        }
      }
      
      return newSelected
    })
  }

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Product not found')
          router.push("/products")
          return
        }
        throw new Error('Failed to fetch product')
      }

      const productData = await response.json()
      console.log('Fetched product data:', productData)
      console.log('Category data:', productData.category)
      setProduct(productData)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
      router.push("/products")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!product) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      toast.success('Product deleted successfully')
      router.push("/products")
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
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

  const categoryName = (() => {
    if (!product.category) return 'Uncategorized'
    
    const category = product.category
    const parentName = category.parent?.name
    const categoryName = category.name
    
    if (parentName && categoryName) {
      return `${parentName} > ${categoryName}`
    } else if (categoryName) {
      return categoryName
    } else {
      return 'Uncategorized'
    }
  })()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon" className="h-9 w-9 border-0">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="font-serif text-3xl font-bold text-foreground">{product.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20">
                {categoryName}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/products/${product.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Product Image & Basic Info */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="md:col-span-1"
        >
          <Card className="border-border/40 shadow-soft overflow-hidden">
            <div className="aspect-square relative bg-muted">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-sm text-muted-foreground font-medium">No Image</span>
                </div>
              )}
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Base Price</span>
                  <span className="text-lg font-semibold text-muted-foreground">{formatCurrency(product.base_price)}</span>
                </div>
                {product.variations && product.variations.length > 0 && (
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-foreground text-sm font-medium">Total Price</span>
                    <span className="text-2xl font-bold text-foreground">{formatCurrency(calculateTotalPrice())}</span>
                  </div>
                )}
                {(!product.variations || product.variations.length === 0) && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Price</span>
                    <span className="text-2xl font-bold text-foreground">{formatCurrency(product.base_price)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Status</span>
                <Badge className={product.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {product.is_available ? "Available" : "Out of Stock"}
                </Badge>
              </div>
              {product.is_featured && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Featured</span>
                  <Badge className="bg-amber-100 text-amber-800">Yes</Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Prep Time</span>
                <span className="text-sm font-medium">{product.prep_time_minutes} minutes</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Details & Inventory */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="md:col-span-2 space-y-6"
        >
          <Card className="border-border/40 shadow-soft">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Product Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || "No description available for this product."}
              </p>
            </CardContent>
          </Card>

          {/* Product Variations */}
          {product.variations && product.variations.length > 0 && (
            <Card className="border-border/40 shadow-soft">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Product Variations</CardTitle>
                <p className="text-sm text-muted-foreground">Select your preferences to see the total price</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {product.variations.map((variation, index) => (
                  <div key={variation.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{variation.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {variation.type === 'radio' ? 'Single Choice' : 'Multiple Choice'}
                      </Badge>
                    </div>
                    
                    {variation.type === 'radio' ? (
                      <RadioGroup
                        value={selectedOptions[variation.id]?.[0] || ""}
                        onValueChange={(value) => handleOptionSelect(variation.id, value, 'radio')}
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          {variation.options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-3 p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors">
                              <RadioGroupItem value={option.id} id={`${variation.id}-${option.id}`} />
                              <Label 
                                htmlFor={`${variation.id}-${option.id}`}
                                className="flex-1 flex items-center justify-between cursor-pointer"
                              >
                                <span className="text-sm font-medium">{option.label}</span>
                                <span className="text-sm text-muted-foreground">
                                  {option.priceModifier > 0 && '+'}
                                  {option.priceModifier !== 0 && formatCurrency(option.priceModifier)}
                                  {option.priceModifier === 0 && 'No charge'}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {variation.options.map((option) => {
                          const isSelected = selectedOptions[variation.id]?.includes(option.id) || false
                          return (
                            <div 
                              key={option.id} 
                              className="flex items-center space-x-3 p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors"
                            >
                              <Checkbox
                                id={`${variation.id}-${option.id}`}
                                checked={isSelected}
                                onCheckedChange={() => handleOptionSelect(variation.id, option.id, 'checkbox')}
                              />
                              <Label 
                                htmlFor={`${variation.id}-${option.id}`}
                                className="flex-1 flex items-center justify-between cursor-pointer"
                              >
                                <span className="text-sm font-medium">{option.label}</span>
                                <span className="text-sm text-muted-foreground">
                                  {option.priceModifier > 0 && '+'}
                                  {option.priceModifier !== 0 && formatCurrency(option.priceModifier)}
                                  {option.priceModifier === 0 && 'No charge'}
                                </span>
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    
                    {index < product.variations.length - 1 && (
                      <div className="border-t border-border/20 pt-2" />
                    )}
                  </div>
                ))}
                
                {/* Price Summary */}
                <div className="border-t pt-4 mt-6">
                  <div className="bg-accent/5 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Base Price:</span>
                      <span>{formatCurrency(product.base_price)}</span>
                    </div>
                    {Object.entries(selectedOptions).map(([variationId, optionIds]) => {
                      const variation = product.variations?.find(v => v.id === variationId)
                      if (!variation || optionIds.length === 0) return null
                      
                      return optionIds.map(optionId => {
                        const option = variation.options.find(opt => opt.id === optionId)
                        if (!option || option.priceModifier === 0) return null
                        
                        return (
                          <div key={`${variationId}-${optionId}`} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{option.label}:</span>
                            <span>+{formatCurrency(option.priceModifier)}</span>
                          </div>
                        )
                      })
                    })}
                    <div className="border-t pt-2 flex items-center justify-between font-semibold">
                      <span>Total Price:</span>
                      <span className="text-lg">{formatCurrency(calculateTotalPrice())}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{product.name}" from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
