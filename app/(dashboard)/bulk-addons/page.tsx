"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Save, X, CheckCircle, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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

interface Category {
  id: string
  name: string
  parent_id: string | null
  parent: { id: string; name: string } | null
  productCount: number
  categoryPath: string
}

interface ApplyResult {
  selectedCategories: string[]
  addonsApplied: Array<{name: string, price: number}>
  updateResults: {
    successful: number
    failed: number
    successfulProducts: Array<{ id: string; name: string }>
    failedProducts: Array<{ id: string; name: string; error: string }>
  }
}

export default function BulkAddonsPage() {
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [addons, setAddons] = useState<Array<{name: string, price: number}>>([{name: '', price: 0.5}])
  const [bulkAddonsText, setBulkAddonsText] = useState('')
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null)
  const [confirmApplyOpen, setConfirmApplyOpen] = useState(false)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bulk-addons')
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const result = await response.json()
      if (result.success) {
        setCategories(result.categories)
      } else {
        throw new Error(result.error || 'Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const addAddonField = () => {
    setAddons(prev => [...prev, {name: '', price: 0.5}])
  }

  const removeAddonField = (index: number) => {
    setAddons(prev => prev.filter((_, i) => i !== index))
  }

  const updateAddon = (index: number, field: 'name' | 'price', value: string | number) => {
    setAddons(prev => prev.map((addon, i) => 
      i === index ? { ...addon, [field]: value } : addon
    ))
  }

  const processBulkAddons = () => {
    if (!bulkAddonsText.trim()) return
    
    const bulkAddons = bulkAddonsText
      .split('\n')
      .map(line => {
        const trimmed = line.trim()
        if (!trimmed) return null
        
        // Check if line has price format: "Addon Name - $1.50" or "Addon Name - 1.50"
        const priceMatch = trimmed.match(/^(.+?)\s*[-–]\s*\$?(\d+\.?\d*)$/)
        if (priceMatch) {
          return {
            name: priceMatch[1].trim(),
            price: parseFloat(priceMatch[2])
          }
        }
        
        // Default price if no price specified
        return {
          name: trimmed,
          price: 0.5
        }
      })
      .filter(addon => addon !== null) as Array<{name: string, price: number}>
    
    setAddons(bulkAddons)
    setBulkAddonsText('')
    toast.success(`Added ${bulkAddons.length} addons from bulk text`)
  }

  const applyAddons = async () => {
    const validAddons = addons.filter(addon => addon.name.trim().length > 0)
    
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category')
      return
    }
    
    if (validAddons.length === 0) {
      toast.error('Please add at least one addon')
      return
    }

    try {
      setApplying(true)
      const response = await fetch('/api/bulk-addons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedCategories,
          addons: validAddons
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to apply addons')
      }

      const result = await response.json()
      if (result.success) {
        setApplyResult(result.data)
        toast.success(`Applied addons to ${result.data.updateResults.successful} products successfully`)
        setConfirmApplyOpen(false)
      } else {
        throw new Error(result.error || 'Failed to apply addons')
      }
    } catch (error) {
      console.error('Error applying addons:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to apply addons')
    } finally {
      setApplying(false)
    }
  }

  const removeAddons = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category')
      return
    }

    try {
      setRemoving(true)
      const response = await fetch(`/api/bulk-addons?categories=${selectedCategories.join(',')}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove addons')
      }

      const result = await response.json()
      if (result.success) {
        toast.success(`Removed addons from ${result.data.updateResults.successful} products successfully`)
        setConfirmRemoveOpen(false)
        setApplyResult(null) // Clear previous results
      } else {
        throw new Error(result.error || 'Failed to remove addons')
      }
    } catch (error) {
      console.error('Error removing addons:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove addons')
    } finally {
      setRemoving(false)
    }
  }

  const selectedCategoriesData = categories.filter(cat => selectedCategories.includes(cat.id))
  const totalProductsSelected = selectedCategoriesData.reduce((sum, cat) => sum + cat.productCount, 0)

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Bulk Addon Manager</h2>
          <p className="text-muted-foreground mt-1">
            Add or remove addons from multiple categories at once
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Categories</CardTitle>
            <CardDescription>
              Choose categories where you want to apply addons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label htmlFor={category.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.categoryPath}</span>
                      <Badge variant="outline" className="ml-2">
                        {category.productCount} products
                      </Badge>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
            
            {selectedCategories.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800">
                  Selected: {selectedCategories.length} categories, {totalProductsSelected} products
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {selectedCategoriesData.map(cat => cat.name).join(', ')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Addon Management */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Addons</CardTitle>
            <CardDescription>
              Add individual addons or paste multiple addons at once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Individual Addons */}
            <div className="space-y-2">
              <Label>Individual Addons</Label>
              {addons.map((addon, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={addon.name}
                    onChange={(e) => updateAddon(index, 'name', e.target.value)}
                    placeholder="Enter addon name"
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      value={addon.price}
                      onChange={(e) => updateAddon(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0.50"
                      className="w-20"
                    />
                  </div>
                  {addons.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeAddonField(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAddonField}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Another Addon
              </Button>
            </div>

            {/* Bulk Addons */}
            <div className="space-y-2">
              <Label>Bulk Addons (One per line)</Label>
              <Textarea
                value={bulkAddonsText}
                onChange={(e) => setBulkAddonsText(e.target.value)}
                placeholder="Paste multiple addons here, one per line:&#10;Extra Shot - $1.50&#10;Whipped Cream - $1.00&#10;Vanilla Syrup - $0.75&#10;&#10;Or without prices (default $0.50):&#10;Cinnamon Powder&#10;Extra Foam"
                rows={6}
              />
              <div className="text-xs text-muted-foreground">
                Format: "Addon Name - $1.50" or just "Addon Name" (default $0.50)
              </div>
              {bulkAddonsText.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={processBulkAddons}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Process Bulk Addons
                </Button>
              )}
            </div>

            {/* Current Addons Preview */}
            {addons.some(addon => addon.name.trim()) && (
              <div className="space-y-2">
                <Label>Current Addons ({addons.filter(a => a.name.trim()).length})</Label>
                <div className="flex flex-wrap gap-1">
                  {addons
                    .filter(addon => addon.name.trim())
                    .map((addon, index) => (
                      <Badge key={index} variant="outline" className="gap-1">
                        {addon.name}
                        <span className="text-green-600 font-medium">+${addon.price.toFixed(2)}</span>
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setConfirmApplyOpen(true)}
                disabled={selectedCategories.length === 0 || !addons.some(a => a.name.trim()) || applying}
                className="gap-2"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Apply Addons
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setConfirmRemoveOpen(true)}
                disabled={selectedCategories.length === 0 || removing}
                className="gap-2"
              >
                {removing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Remove Addons
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {applyResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Bulk Addon Application Results
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
                  {applyResult.addonsApplied.length}
                </div>
                <div className="text-sm text-muted-foreground">Addons Applied</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {applyResult.selectedCategories.length}
                </div>
                <div className="text-sm text-muted-foreground">Categories Updated</div>
              </div>
            </div>

            {applyResult.updateResults.failed > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    {applyResult.updateResults.failed} products failed to update
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Applied Addons:</h4>
                <div className="flex flex-wrap gap-1">
                  {applyResult.addonsApplied.map((addon, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {typeof addon === 'string' ? addon : addon.name}
                      {typeof addon === 'object' && (
                        <span className="text-green-600 font-medium">+${addon.price.toFixed(2)}</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {applyResult.updateResults.successfulProducts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Successfully Updated Products:</h4>
                  <div className="text-sm text-muted-foreground">
                    {applyResult.updateResults.successfulProducts.slice(0, 10).map(p => p.name).join(', ')}
                    {applyResult.updateResults.successfulProducts.length > 10 && 
                      ` and ${applyResult.updateResults.successfulProducts.length - 10} more...`
                    }
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apply Confirmation Dialog */}
      <AlertDialog open={confirmApplyOpen} onOpenChange={setConfirmApplyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Addons to Selected Categories?</AlertDialogTitle>
            <AlertDialogDescription>
              This will add the specified addons to all products in the selected categories. 
              Existing addons will be replaced with the new ones.
              <br /><br />
              <strong>Categories:</strong> {selectedCategories.length}
              <br />
              <strong>Products affected:</strong> {totalProductsSelected}
              <br />
              <strong>Addons to apply:</strong> {addons.filter(a => a.name.trim()).length}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applying}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={applyAddons}
              disabled={applying}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {applying ? 'Applying...' : 'Apply Addons'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Addons from Selected Categories?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all addon variations from products in the selected categories. 
              Other variations (like size, milk options) will remain unchanged.
              <br /><br />
              <strong>Categories:</strong> {selectedCategories.length}
              <br />
              <strong>Products affected:</strong> {totalProductsSelected}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeAddons}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? 'Removing...' : 'Remove Addons'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}