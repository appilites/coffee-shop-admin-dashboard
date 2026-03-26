"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import type { FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema, type ProductFormValues } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, X, Plus, Trash2, Save } from "lucide-react"
import { toast } from "sonner"
import { ProductImage } from "@/components/ui/product-image"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Category {
  id: string
  name: string
  description?: string | null
  display_order?: number
  is_active?: boolean
  parent_id?: string | null
  created_at?: string
  updated_at?: string
  parent?: {
    id: string
    name: string
  } | null
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  categoryId: string
  categoryPath?: string
  isAvailable: boolean
  isFeatured: boolean
  sku: string | null
  variations?: Variation[]
}

interface ProductFormProps {
  product?: Product
  categories: Category[]
}

interface VariationOption {
  id: string
  label: string
  priceModifier: number
}

interface Variation {
  id: string
  title: string
  type: "checkbox" | "radio"
  required: boolean
  options: VariationOption[]
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [variations, setVariations] = useState<Variation[]>(
    (product?.variations || []).map(v => ({ ...v, required: (v as any).required ?? true }))
  )
  // Raw string display values for price modifier inputs (allows clearing "0" with backspace)
  const [priceInputValues, setPriceInputValues] = useState<Record<string, string>>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description || "",
          price: product.price,
          categoryId: product.categoryId,
          imageUrl: product.imageUrl || "",
          isAvailable: product.isAvailable,
          isFeatured: product.isFeatured,
          sku: product.sku || "",
          variations: product.variations || [],
          loyaltyPointsEarn: (product as any).loyaltyPointsEarn ?? 0,
        }
      : {
          isAvailable: true,
          isFeatured: false,
          variations: [],
          loyaltyPointsEarn: 0,
        },
  })

  const categoryId = watch("categoryId")
  const isAvailable = watch("isAvailable")
  const isFeatured = watch("isFeatured")
  const price = watch("price")

  // Sync image preview when editing a product that has an image (e.g. after load or navigation)
  useEffect(() => {
    if (product?.imageUrl) {
      setImagePreview(product.imageUrl)
      setValue("imageUrl", product.imageUrl)
    }
  }, [product?.id, product?.imageUrl, setValue])

  // Calculate total price including all variation options
  const calculateTotalPrice = () => {
    const basePrice = price || 0
    let totalVariationCost = 0
    
    variations.forEach(variation => {
      variation.options.forEach(option => {
        totalVariationCost += option.priceModifier || 0
      })
    })
    
    return basePrice + totalVariationCost
  }

  // Calculate minimum and maximum possible prices for customers
  const calculatePriceRange = () => {
    const basePrice = price || 0
    let minPrice = basePrice
    let maxPrice = basePrice
    
    variations.forEach(variation => {
      if (variation.type === 'radio') {
        // For radio buttons, customer picks one option
        const prices = variation.options.map(opt => opt.priceModifier || 0)
        const minVariationPrice = Math.min(...prices)
        const maxVariationPrice = Math.max(...prices)
        minPrice += minVariationPrice
        maxPrice += maxVariationPrice
      } else {
        // For checkboxes, customer can pick multiple options
        const totalVariationPrice = variation.options.reduce((sum, opt) => sum + (opt.priceModifier || 0), 0)
        maxPrice += totalVariationPrice
        // minPrice stays the same (customer can choose none)
      }
    })
    
    return { minPrice, maxPrice }
  }

  const totalPrice = calculateTotalPrice()
  const priceRange = calculatePriceRange()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setImageFile(null)
    setValue("imageUrl", "")
  }

  const addVariation = () => {
    const newVariation: Variation = {
      id: `var-${Date.now()}`,
      title: "",
      type: "radio",
      required: true,
      options: [
        {
          id: `opt-${Date.now()}-1`,
          label: "",
          priceModifier: 0,
        },
      ],
    }
    const updatedVariations = [...variations, newVariation]
    setVariations(updatedVariations)
    setValue("variations", updatedVariations)
  }

  const removeVariation = (variationId: string) => {
    const updatedVariations = variations.filter((v) => v.id !== variationId)
    setVariations(updatedVariations)
    setValue("variations", updatedVariations)
  }

  const updateVariation = (variationId: string, field: keyof Variation, value: any) => {
    const updatedVariations = variations.map((v) =>
      v.id === variationId ? { ...v, [field]: value } : v
    )
    setVariations(updatedVariations)
    setValue("variations", updatedVariations)
  }

  const addOption = (variationId: string) => {
    const updatedVariations = variations.map((v) =>
      v.id === variationId
        ? {
            ...v,
            options: [
              ...v.options,
              {
                id: `opt-${Date.now()}`,
                label: "",
                priceModifier: 0,
              },
            ],
          }
        : v
    )
    setVariations(updatedVariations)
    setValue("variations", updatedVariations)
  }

  const removeOption = (variationId: string, optionId: string) => {
    const updatedVariations = variations.map((v) =>
      v.id === variationId
        ? {
            ...v,
            options: v.options.filter((o) => o.id !== optionId),
          }
        : v
    )
    setVariations(updatedVariations)
    setValue("variations", updatedVariations)
  }

  const updateOption = (
    variationId: string,
    optionId: string,
    field: keyof VariationOption,
    value: any
  ) => {
    const updatedVariations = variations.map((v) =>
      v.id === variationId
        ? {
            ...v,
            options: v.options.map((o) =>
              o.id === optionId ? { ...o, [field]: value } : o
            ),
          }
        : v
    )
    setVariations(updatedVariations)
    setValue("variations", updatedVariations)
  }

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true)

    try {
      // Keep only complete variations/options so partial UI edits don't block product updates.
      const sanitizedVariations = (variations || [])
        .map((variation) => ({
          ...variation,
          title: variation.title?.trim() || "",
          options: (variation.options || [])
            .map((option) => ({
              ...option,
              label: option.label?.trim() || "",
              priceModifier: Number(option.priceModifier || 0),
            }))
            .filter((option) => option.label.length > 0),
        }))
        .filter((variation) => variation.title.length > 0 && variation.options.length > 0)

      // Include variations and calculated prices in the form data
      const formData = {
        ...data,
        variations: sanitizedVariations,
        calculatedTotalPrice: totalPrice,
        priceRange: priceRange,
      }

      let imageUrl = data.imageUrl

      // Handle image upload if there's a new file
      if (imageFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', imageFile)

        try {
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          })

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            imageUrl = uploadResult.url
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          // Continue without image if upload fails
        }
      }

      // Update form data with image URL
      const finalFormData = {
        ...formData,
        imageUrl,
      }

      // Call the appropriate API endpoint
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'

      console.log('🚀 Submitting product form:', finalFormData)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFormData),
      })

      console.log('📡 API Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error response:', errorData)
        
        let errorMessage = 'Failed to save product'
        if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.details) {
          errorMessage = errorData.details
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('✅ Product saved successfully:', result)
      
      toast.success(product ? "Product updated successfully" : "Product created successfully")
      
      // Use router refresh to ensure fresh data
      router.refresh()
      router.push("/products")
    } catch (error) {
      console.error('❌ Error saving product:', error)
      
      let errorMessage = 'Failed to save product'
      
      if (error instanceof Error) {
        errorMessage = error.message
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      } else {
        console.error('❌ Unknown error type:', typeof error, error)
        errorMessage = 'An unknown error occurred'
      }
      
      // Show specific error messages for common issues
      if (errorMessage.includes('Category not found')) {
        toast.error('Selected category is invalid. Please refresh the page and try again.')
      } else if (errorMessage.includes('Missing required fields')) {
        toast.error('Please fill in all required fields (name, price, category)')
      } else if (errorMessage.includes('Database insert failed')) {
        toast.error('Database error: ' + errorMessage)
      } else if (errorMessage.includes('Category validation failed')) {
        toast.error('Category validation failed. Please sync data first.')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const onInvalid = (formErrors: FieldErrors<ProductFormValues>) => {
    console.error("❌ Product form validation failed:", formErrors)
    const firstError = Object.values(formErrors).find(Boolean) as { message?: string } | undefined
    toast.error(firstError?.message || "Please fix required fields before updating")
  }

  return (
    <Card className="border-border/40 shadow-soft">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex items-center gap-4">
              {(imagePreview ?? product?.imageUrl) && (
                <div className="relative h-32 w-32 overflow-hidden rounded-lg border">
                  <ProductImage 
                    src={imagePreview ?? product?.imageUrl ?? undefined} 
                    alt="Product preview" 
                    className="h-full w-full"
                    showFallbackIcon={false}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, or WebP. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Espresso Shot"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Product description..."
              rows={4}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Category and Price */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoryId">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={categoryId}
                onValueChange={(value) => setValue("categoryId", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    // Organize categories hierarchically for better display
                    const organizeCategories = () => {
                      const topLevel = categories.filter(cat => !cat.parent_id)
                      const children = categories.filter(cat => cat.parent_id)
                      
                      const organized: (typeof categories[0] & { level: number })[] = []
                      
                      const addCategory = (category: typeof categories[0], level: number = 0) => {
                        organized.push({ ...category, level })
                        
                        // Add children
                        const categoryChildren = children.filter(child => child.parent_id === category.id)
                        categoryChildren
                          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                          .forEach(child => addCategory(child, level + 1))
                      }
                      
                      topLevel
                        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                        .forEach(category => addCategory(category))
                      
                      return organized
                    }

                    return organizeCategories().map((category) => {
                      const indent = "  ".repeat(category.level)
                      const prefix = category.level > 0 ? "└─ " : ""
                      const displayName = `${indent}${prefix}${category.name}`
                      
                      return (
                        <SelectItem key={category.id} value={category.id}>
                          <span className={category.level > 0 ? "text-muted-foreground" : ""}>
                            {displayName}
                          </span>
                        </SelectItem>
                      )
                    })
                  })()}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                Price <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                placeholder="0.00"
                disabled={isSubmitting}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              
              {/* Price Summary */}
              {variations.length > 0 && price && (
                <div className="mt-3 p-3 bg-accent/5 border border-accent/20 rounded-lg space-y-2">
                  <div className="text-xs font-medium text-accent">Price Summary</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Price:</span>
                      <span>${price.toFixed(2)}</span>
                    </div>
                    {variations.map(variation => 
                      variation.options.map(option => 
                        option.priceModifier !== 0 && (
                          <div key={`${variation.id}-${option.id}`} className="flex justify-between text-muted-foreground">
                            <span>{option.label || 'Unnamed Option'}:</span>
                            <span>+${option.priceModifier.toFixed(2)}</span>
                          </div>
                        )
                      )
                    )}
                    <div className="border-t pt-1 flex justify-between font-medium">
                      <span>Customer Price Range:</span>
                      <span>
                        {priceRange.minPrice === priceRange.maxPrice 
                          ? `$${priceRange.minPrice.toFixed(2)}`
                          : `$${priceRange.minPrice.toFixed(2)} - $${priceRange.maxPrice.toFixed(2)}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">SKU (Optional)</Label>
            <Input
              id="sku"
              {...register("sku")}
              placeholder="Product SKU"
              disabled={isSubmitting}
            />
            {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
          </div>

          {/* Loyalty Points */}
          <div className="space-y-2">
            <Label htmlFor="loyaltyPointsEarn" className="flex items-center gap-2">
              🎁 Loyalty Points Earned
            </Label>
            <Input
              id="loyaltyPointsEarn"
              type="number"
              min={0}
              step={1}
              {...register("loyaltyPointsEarn", { valueAsNumber: true })}
              placeholder="0"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Points a customer earns when they purchase this product. Set to 0 to disable.
            </p>
            {errors.loyaltyPointsEarn && <p className="text-sm text-destructive">{errors.loyaltyPointsEarn.message}</p>}
          </div>

          {/* Variations */}
          <div className="space-y-3">
            {product?.variations && product.variations.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-amber-600 mt-0.5">⚠️</div>
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">This product already has variations</p>
                    <p className="text-amber-700 mt-1">
                      Current variations will be replaced when you save. Use "Clear All" to remove existing variations before adding new ones.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Product Variations</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Add variations like size, flavor, or add-ons
                </p>
              </div>
              <div className="flex gap-2">
                {variations.length > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setVariations([])
                        setValue("variations", [])
                        toast.success("All variations cleared")
                      }}
                      className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear All
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={async () => {
                        if (!product) {
                          toast.error("Please save the product first before saving variations")
                          return
                        }

                        try {
                          setIsSubmitting(true)
                          const response = await fetch(`/api/products/${product.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              variations: variations,
                            }),
                          })

                          if (!response.ok) {
                            const errorData = await response.json()
                            throw new Error(errorData.error || 'Failed to save variations')
                          }

                          toast.success("Variations saved successfully")
                        } catch (error) {
                          console.error('Error saving variations:', error)
                          toast.error(error instanceof Error ? error.message : 'Failed to save variations')
                        } finally {
                          setIsSubmitting(false)
                        }
                      }}
                      disabled={isSubmitting}
                      className="gap-1.5 h-8 text-xs"
                    >
                      <Save className="h-3 w-3" />
                      {product ? "Save Variations" : "Save Product First"}
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariation}
                  disabled={isSubmitting}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add Variation
                </Button>
              </div>
            </div>

            {variations.length > 0 && (
              <div className="space-y-3">
                {variations.map((variation, index) => (
                  <Card key={variation.id} className="border-border/40 p-3">
                    <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Variation Title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              value={variation.title}
                              onChange={(e) =>
                                updateVariation(variation.id, "title", e.target.value)
                              }
                              placeholder="e.g., Size, Flavor, Add-ons"
                              disabled={isSubmitting}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Option Type</Label>
                            <Select
                              value={variation.type}
                              onValueChange={(value: "checkbox" | "radio") =>
                                updateVariation(variation.id, "type", value)
                              }
                              disabled={isSubmitting}
                            >
                              <SelectTrigger className="bg-white border-border/60 h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="radio" className="text-sm">Radio (Single Selection)</SelectItem>
                                <SelectItem value="checkbox" className="text-sm">Checkbox (Multiple Selection)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => removeVariation(variation.id)}
                            disabled={isSubmitting}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Required toggle */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <Checkbox
                          id={`required-${variation.id}`}
                          checked={variation.required ?? true}
                          onCheckedChange={(checked) =>
                            updateVariation(variation.id, "required", Boolean(checked))
                          }
                          disabled={isSubmitting}
                          className="h-4 w-4 border-2 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label
                          htmlFor={`required-${variation.id}`}
                          className="text-xs cursor-pointer select-none"
                        >
                          {variation.required ?? true
                            ? <span className="text-destructive font-medium">Required — customer must choose</span>
                            : <span className="text-muted-foreground">Optional — customer may skip</span>
                          }
                        </Label>
                      </div>

                      <Separator className="my-2" />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">Options</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(variation.id)}
                            disabled={isSubmitting}
                            className="gap-1.5 h-7 text-xs"
                          >
                            <Plus className="h-2.5 w-2.5" />
                            Add Option
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {variation.options.map((option, optIndex) => (
                            <div
                              key={option.id}
                              className="flex items-start gap-2 p-2 border border-border/40 rounded-lg bg-muted/30"
                            >
                              <div className="flex-1 grid gap-2 md:grid-cols-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Option Label</Label>
                                  <Input
                                    value={option.label}
                                    onChange={(e) =>
                                      updateOption(
                                        variation.id,
                                        option.id,
                                        "label",
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g., Small, Large, Extra Shot"
                                    disabled={isSubmitting}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Price Modifier ($)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={priceInputValues[option.id] ?? String(option.priceModifier)}
                                    onChange={(e) => {
                                      const raw = e.target.value
                                      setPriceInputValues(prev => ({ ...prev, [option.id]: raw }))
                                      const num = parseFloat(raw)
                                      if (!isNaN(num)) {
                                        updateOption(variation.id, option.id, "priceModifier", num)
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const num = parseFloat(e.target.value)
                                      const finalNum = isNaN(num) ? 0 : num
                                      setPriceInputValues(prev => {
                                        const next = { ...prev }
                                        delete next[option.id]
                                        return next
                                      })
                                      updateOption(variation.id, option.id, "priceModifier", finalNum)
                                    }}
                                    onFocus={(e) => e.target.select()}
                                    placeholder="0.00"
                                    disabled={isSubmitting}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                              {variation.options.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  onClick={() => removeOption(variation.id, option.id)}
                                  disabled={isSubmitting}
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="isAvailable">Availability</Label>
              <Select
                value={isAvailable ? "available" : "unavailable"}
                onValueChange={(value) => setValue("isAvailable", value === "available")}
                disabled={isSubmitting}
              >
                <SelectTrigger id="isAvailable" className="bg-white border-border/60">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isFeatured">Featured Status</Label>
              <Select
                value={isFeatured ? "featured" : "standard"}
                onValueChange={(value) => setValue("isFeatured", value === "featured")}
                disabled={isSubmitting}
              >
                <SelectTrigger id="isFeatured" className="bg-white border-border/60">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="featured">Featured Product</SelectItem>
                  <SelectItem value="standard">Standard Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                product ? "Update Product" : "Create Product"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
