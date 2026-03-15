"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@/data/mock-data"
import { ProductImage } from "@/components/ui/product-image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"

interface ProductGridProps {
  products: Product[]
  onProductDeleted?: () => void
}

export function ProductGrid({ products, onProductDeleted }: ProductGridProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!productToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/products/${productToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      toast.success('Product deleted successfully')
      setDeleteDialogOpen(false)
      setProductToDelete(null)
      onProductDeleted?.() // Trigger refresh
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <TooltipProvider>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="border-border/40 shadow-soft hover:shadow-soft-lg transition-all duration-200 overflow-hidden group h-full flex flex-col">
              {/* Image */}
              <Link href={`/products/${product.id}`} className="relative aspect-[16/10] w-full flex-none cursor-pointer group/image">
                <ProductImage
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full rounded-t-lg group-hover/image:scale-110 transition-transform duration-300"
                  showFallbackIcon={false}
                />
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pointer-events-none">
                  {product.isFeatured && (
                    <Badge className="bg-amber-500 text-white border-0 text-[10px] px-1.5 py-0">Featured</Badge>
                  )}
                  {!product.isAvailable && (
                    <Badge variant="destructive" className="border-0 text-[10px] px-1.5 py-0">Out of Stock</Badge>
                  )}
                </div>
              </Link>

              <CardHeader className="p-3 pb-0 flex-none text-left">
                <Link href={`/products/${product.id}`} className="flex flex-col items-start gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                  <h3 className="font-serif text-sm font-semibold text-foreground line-clamp-2 w-full leading-tight h-9">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      {product.categoryPath || product.category?.name || 'Uncategorized'}
                    </span>
                  </div>
                </Link>
              </CardHeader>

              <CardContent className="p-3 pt-2 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-base text-foreground">
                    {formatCurrency(product.price)}
                  </span>
                  <div className="flex items-center gap-1">
                    {(product as any).variations && (product as any).variations.length > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                        {(product as any).variations.length} variations
                      </Badge>
                    )}
                    {product.sku && (
                      <span className="text-[10px] text-muted-foreground truncate">SKU: {product.sku}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/products/${product.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="w-full border-border/60 hover:bg-white h-7 group/btn"
                        >
                          <Eye className="h-3.5 w-3.5 group-hover/btn:text-[#5d3b2a]" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white text-foreground border border-border/40 shadow-md">
                      <p>View Details</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/products/${product.id}/edit`} className="flex-1">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="w-full border-border/60 hover:bg-white h-7 group/btn"
                        >
                          <Edit className="h-3.5 w-3.5 group-hover/btn:text-[#5d3b2a]" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white text-foreground border border-border/40 shadow-md">
                      <p>Edit Product</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="flex-1 border-border/60 hover:bg-white h-7 group/btn"
                        onClick={() => {
                          setProductToDelete(product.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 group-hover/btn:text-[#5d3b2a]" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white text-destructive border border-border/40 shadow-md">
                      <p>Delete Product</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </TooltipProvider>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the product from your catalog.
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
    </>
  )
}
