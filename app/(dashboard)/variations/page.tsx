"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Edit, Trash2, Eye, Settings, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

interface Variation {
  id: string
  title: string
  type: "checkbox" | "radio"
  options: Array<{
    id: string
    label: string
    priceModifier: number
  }>
}

interface ProductWithVariations {
  id: string
  name: string
  basePrice: number
  imageUrl: string | null
  category: { id: string; name: string } | null
  hasVariations: boolean
  variationsCount: number
  variations: Variation[]
  priceRange: { minPrice: number; maxPrice: number }
}

interface VariationsData {
  summary: {
    totalProducts: number
    productsWithVariations: number
    productsWithoutVariations: number
    totalVariations: number
  }
  productsWithVariations: ProductWithVariations[]
  productsWithoutVariations: ProductWithVariations[]
}

export default function VariationsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<VariationsData | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToRemoveVariations, setProductToRemoveVariations] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    fetchVariations()
  }, [])

  const fetchVariations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/variations')
      
      if (!response.ok) {
        throw new Error('Failed to fetch variations')
      }

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching variations:', error)
      toast.error('Failed to load variations data')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveVariations = async () => {
    if (!productToRemoveVariations) return

    try {
      setRemoving(true)
      const response = await fetch(`/api/variations?productId=${productToRemoveVariations}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove variations')
      }

      toast.success('Variations removed successfully')
      setDeleteDialogOpen(false)
      setProductToRemoveVariations(null)
      fetchVariations() // Refresh data
    } catch (error) {
      console.error('Error removing variations:', error)
      toast.error('Failed to remove variations')
    } finally {
      setRemoving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading variations...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load variations data</p>
        <Button onClick={fetchVariations} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Product Variations</h2>
          <p className="text-muted-foreground mt-1">
            Manage variations for all your products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchVariations} variant="outline" disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/setup-variations">
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Setup Variations
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.summary.productsWithVariations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Without Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.summary.productsWithoutVariations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.summary.totalVariations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Products with Variations */}
      {data.productsWithVariations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Products with Variations ({data.productsWithVariations.length})</CardTitle>
            <CardDescription>
              Products that have customization options configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Price Range</TableHead>
                  <TableHead>Variations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.productsWithVariations.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(product.basePrice)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatCurrency(product.priceRange.minPrice)} - {formatCurrency(product.priceRange.maxPrice)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.variations.map((variation) => (
                          <Badge key={variation.id} variant="outline" className="text-xs">
                            {variation.title} ({variation.options.length})
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/products/${product.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setProductToRemoveVariations(product.id)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Products without Variations */}
      {data.productsWithoutVariations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Products without Variations ({data.productsWithoutVariations.length})</CardTitle>
            <CardDescription>
              Products that don't have any customization options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.productsWithoutVariations.slice(0, 9).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {product.imageUrl && (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="h-8 w-8 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(product.basePrice)}
                      </div>
                    </div>
                  </div>
                  <Link href={`/products/${product.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            {data.productsWithoutVariations.length > 9 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  And {data.productsWithoutVariations.length - 9} more products...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove All Variations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all variations from this product. The product will no longer have any customization options. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveVariations}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? 'Removing...' : 'Remove Variations'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}