"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Coffee, Plus, Check } from "lucide-react"

interface Product {
  id: string
  name: string
  base_price: number
  description: string | null
  variations?: any[]
}

export default function SetupVariationsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addingVariations, setAddingVariations] = useState(false)
  const [addingToProduct, setAddingToProduct] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        throw new Error('Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const addCoffeeVariationsToAll = async () => {
    try {
      setAddingVariations(true)
      const response = await fetch('/api/setup/add-coffee-variations', {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Added variations to ${result.updatedCount} products`)
        fetchProducts() // Refresh the list
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add variations')
      }
    } catch (error) {
      console.error('Error adding variations:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add variations')
    } finally {
      setAddingVariations(false)
    }
  }

  const addVariationsToProduct = async (productId: string) => {
    try {
      setAddingToProduct(productId)
      
      // Define coffee shop variations for individual product
      const coffeeVariations = [
        {
          id: "size-variation",
          title: "Size",
          type: "radio",
          options: [
            { id: "size-small", label: "Small (8oz)", priceModifier: 0 },
            { id: "size-medium", label: "Medium (12oz)", priceModifier: 0.50 },
            { id: "size-large", label: "Large (16oz)", priceModifier: 1.00 }
          ]
        },
        {
          id: "milk-variation",
          title: "Milk Options",
          type: "radio",
          options: [
            { id: "milk-regular", label: "Regular Milk", priceModifier: 0 },
            { id: "milk-almond", label: "Almond Milk", priceModifier: 0.60 },
            { id: "milk-oat", label: "Oat Milk", priceModifier: 0.65 },
            { id: "milk-soy", label: "Soy Milk", priceModifier: 0.55 }
          ]
        },
        {
          id: "addons-variation",
          title: "Add-ons",
          type: "checkbox",
          options: [
            { id: "addon-extra-shot", label: "Extra Shot", priceModifier: 0.75 },
            { id: "addon-whipped-cream", label: "Whipped Cream", priceModifier: 0.50 },
            { id: "addon-vanilla-syrup", label: "Vanilla Syrup", priceModifier: 0.50 },
            { id: "addon-caramel-syrup", label: "Caramel Syrup", priceModifier: 0.50 }
          ]
        }
      ]

      const response = await fetch('/api/setup/add-custom-variations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          variations: coffeeVariations
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Added variations to ${result.product.name}`)
        fetchProducts() // Refresh the list
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add variations')
      }
    } catch (error) {
      console.error('Error adding variations:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add variations')
    } finally {
      setAddingToProduct(null)
    }
  }

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

  const productsWithoutVariations = products.filter(p => !p.variations || p.variations.length === 0)
  const productsWithVariations = products.filter(p => p.variations && p.variations.length > 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-serif text-3xl font-bold text-foreground">Setup Product Variations</h2>
        <p className="text-muted-foreground mt-1">
          Add size, milk options, and add-ons to your coffee shop products
        </p>
      </div>

      {/* Bulk Action */}
      <Card className="border-border/40 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Bulk Add Coffee Variations
          </CardTitle>
          <CardDescription>
            Add standard coffee shop variations (Size, Milk Options, Add-ons) to all products without variations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                This will add Size (Small/Medium/Large), Milk Options (Regular/Almond/Oat/Soy), 
                and Add-ons (Extra Shot, Syrups, etc.) to {productsWithoutVariations.length} products
              </p>
            </div>
            <Button 
              onClick={addCoffeeVariationsToAll}
              disabled={addingVariations || productsWithoutVariations.length === 0}
            >
              {addingVariations ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to All ({productsWithoutVariations.length})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products without variations */}
      {productsWithoutVariations.length > 0 && (
        <Card className="border-border/40 shadow-soft">
          <CardHeader>
            <CardTitle>Products Without Variations ({productsWithoutVariations.length})</CardTitle>
            <CardDescription>
              These products don't have variations yet. Click to add coffee shop variations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {productsWithoutVariations.map((product) => (
                <div key={product.id} className="p-4 border border-border/40 rounded-lg bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{product.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      ${product.base_price.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {product.description || "No description"}
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => addVariationsToProduct(product.id)}
                    disabled={addingToProduct === product.id}
                  >
                    {addingToProduct === product.id ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-3 w-3" />
                        Add Variations
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products with variations */}
      {productsWithVariations.length > 0 && (
        <Card className="border-border/40 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Products With Variations ({productsWithVariations.length})
            </CardTitle>
            <CardDescription>
              These products already have variations configured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {productsWithVariations.map((product) => (
                <div key={product.id} className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{product.name}</h4>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {product.variations?.length} variations
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Base: ${product.base_price.toFixed(2)}
                  </p>
                  <div className="text-xs text-green-700">
                    ✓ Variations configured
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {products.length === 0 && (
        <Card className="border-border/40 shadow-soft">
          <CardContent className="text-center py-12">
            <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
              No products found
            </h3>
            <p className="text-muted-foreground">
              Create some products first, then come back to add variations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}