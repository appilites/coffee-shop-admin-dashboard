"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Edit, Trash2, Eye, Settings, RefreshCw, Download, Upload, CheckCircle, AlertCircle } from "lucide-react"
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

interface AddonData {
  targetCategories: Array<{ id: string; name: string }>
  totalProducts: number
  totalUniqueAddons: number
  uniqueAddons: string[]
  addonCategories: {
    sizes: string[]
    milkOptions: string[]
    sweeteners: string[]
    extras: string[]
    other: string[]
  }
  summary: {
    sizes: number
    milkOptions: number
    sweeteners: number
    extras: number
    other: number
  }
}

interface ApplyResult {
  targetCategories: Array<{ id: string; name: string }>
  totalProducts: number
  updateResults: {
    successful: number
    failed: number
  }
  summary: {
    variationsCreated: number
    totalOptions: number
  }
}

export default function VariationsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<VariationsData | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToRemoveVariations, setProductToRemoveVariations] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  
  // Addon extraction states
  const [extractingAddons, setExtractingAddons] = useState(false)
  const [applyingAddons, setApplyingAddons] = useState(false)
  const [addonData, setAddonData] = useState<AddonData | null>(null)
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null)
  const [confirmApplyOpen, setConfirmApplyOpen] = useState(false)

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

  const extractAddons = async () => {
    try {
      setExtractingAddons(true)
      const response = await fetch('/api/extract-addons')
      
      if (!response.ok) {
        throw new Error('Failed to extract addons')
      }

      const result = await response.json()
      if (result.success) {
        setAddonData(result.data)
        toast.success(`Extracted ${result.data.totalUniqueAddons} unique addons from ${result.data.totalProducts} products`)
      } else {
        throw new Error(result.error || 'Failed to extract addons')
      }
    } catch (error) {
      console.error('Error extracting addons:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to extract addons')
    } finally {
      setExtractingAddons(false)
    }
  }

  const applyUnifiedAddons = async () => {
    if (!addonData) return

    try {
      setApplyingAddons(true)
      const response = await fetch('/api/extract-addons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unifiedAddons: addonData.uniqueAddons,
          applyToCategories: addonData.targetCategories.map(c => c.name)
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to apply unified addons')
      }

      const result = await response.json()
      if (result.success) {
        setApplyResult(result.data)
        toast.success(`Applied unified addons to ${result.data.updateResults.successful} products successfully`)
        setConfirmApplyOpen(false)
        fetchVariations() // Refresh variations data
      } else {
        throw new Error(result.error || 'Failed to apply unified addons')
      }
    } catch (error) {
      console.error('Error applying unified addons:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to apply unified addons')
    } finally {
      setApplyingAddons(false)
    }
  }

  const downloadMDFile = () => {
    if (!addonData) return

    const mdContent = `# Coffee Shop Addons List

## Categories Included
${addonData.targetCategories.map(cat => `- ${cat.name}`).join('\n')}

## Total Statistics
- **Total Products**: ${addonData.totalProducts}
- **Unique Addons**: ${addonData.totalUniqueAddons}

## Addon Categories

### Sizes (${addonData.addonCategories.sizes.length})
${addonData.addonCategories.sizes.map(addon => `- ${addon}`).join('\n')}

### Milk Options (${addonData.addonCategories.milkOptions.length})
${addonData.addonCategories.milkOptions.map(addon => `- ${addon}`).join('\n')}

### Sweeteners (${addonData.addonCategories.sweeteners.length})
${addonData.addonCategories.sweeteners.map(addon => `- ${addon}`).join('\n')}

### Extras (${addonData.addonCategories.extras.length})
${addonData.addonCategories.extras.map(addon => `- ${addon}`).join('\n')}

### Other Options (${addonData.addonCategories.other.length})
${addonData.addonCategories.other.map(addon => `- ${addon}`).join('\n')}

## All Addons (Alphabetical)
${addonData.uniqueAddons.map(addon => `- ${addon}`).join('\n')}

---
*Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*
`

    const blob = new Blob([mdContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'coffee-shop-addons.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Addons list downloaded as MD file')
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
          <Button onClick={extractAddons} variant="outline" disabled={extractingAddons} className="gap-2">
            <Download className={`h-4 w-4 ${extractingAddons ? 'animate-spin' : ''}`} />
            {extractingAddons ? 'Extracting...' : 'Extract Addons'}
          </Button>
          {addonData && (
            <>
              <Button onClick={downloadMDFile} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download MD
              </Button>
              <Button onClick={() => setConfirmApplyOpen(true)} disabled={applyingAddons} className="gap-2">
                <Upload className={`h-4 w-4 ${applyingAddons ? 'animate-spin' : ''}`} />
                {applyingAddons ? 'Applying...' : 'Apply Unified'}
              </Button>
            </>
          )}
          <Link href="/bulk-addons">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Bulk Addons
            </Button>
          </Link>
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

      {/* Addon Extraction Results */}
      {addonData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Extracted Addons from Target Categories
            </CardTitle>
            <CardDescription>
              Addons extracted from: {addonData.targetCategories.map(c => c.name).join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{addonData.totalUniqueAddons}</div>
                <div className="text-sm text-muted-foreground">Unique Addons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{addonData.summary.sizes}</div>
                <div className="text-sm text-muted-foreground">Sizes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{addonData.summary.milkOptions}</div>
                <div className="text-sm text-muted-foreground">Milk Options</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{addonData.summary.sweeteners}</div>
                <div className="text-sm text-muted-foreground">Sweeteners</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{addonData.summary.extras}</div>
                <div className="text-sm text-muted-foreground">Extras</div>
              </div>
            </div>
            
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(addonData.addonCategories).map(([category, addons]) => (
                <div key={category} className="p-3 border rounded-lg">
                  <div className="font-medium mb-2 capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()} ({addons.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {addons.slice(0, 5).map((addon, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {addon}
                      </Badge>
                    ))}
                    {addons.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{addons.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apply Results */}
      {applyResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Unified Addons Applied Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {applyResult.updateResults.successful}
                </div>
                <div className="text-sm text-muted-foreground">Products Updated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {applyResult.summary.variationsCreated}
                </div>
                <div className="text-sm text-muted-foreground">Variations Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {applyResult.summary.totalOptions}
                </div>
                <div className="text-sm text-muted-foreground">Total Options</div>
              </div>
            </div>
            
            {applyResult.updateResults.failed > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    {applyResult.updateResults.failed} products failed to update
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Apply Unified Addons Confirmation Dialog */}
      <AlertDialog open={confirmApplyOpen} onOpenChange={setConfirmApplyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Unified Addons?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace existing variations on all products in the target categories with standardized addon variations. 
              This action cannot be undone. Are you sure you want to proceed?
              <br /><br />
              <strong>Products affected:</strong> {addonData?.totalProducts || 0}
              <br />
              <strong>Categories:</strong> {addonData?.targetCategories.map(c => c.name).join(', ')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applyingAddons}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={applyUnifiedAddons}
              disabled={applyingAddons}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {applyingAddons ? 'Applying...' : 'Apply Unified Addons'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}