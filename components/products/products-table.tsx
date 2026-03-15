"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
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
import { toast } from "sonner"
import type { Product } from "@/data/mock-data"
import { ProductImage } from "@/components/ui/product-image"

import Link from "next/link"

interface ProductsTableProps {
  products: Product[]
  onProductDeleted?: () => void
}

export function ProductsTable({ products: initialProducts, onProductDeleted }: ProductsTableProps) {
  const [products] = useState(initialProducts)
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
      <div className="rounded-xl border border-border/40 bg-card shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-muted/30">
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead className="font-serif">Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Variations</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product, index) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-border/40 hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg"
                      showFallbackIcon={true}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {product.categoryPath || product.category?.name || 'Uncategorized'}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    {(product as any).variations && (product as any).variations.length > 0 ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {(product as any).variations.length} variations
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {product.isAvailable ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Out of Stock</Badge>
                      )}
                      {product.isFeatured && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/products/${product.id}`}>
                              <Button variant="outline" size="icon-sm" className="h-7 w-7 border-border/60 group/btn hover:bg-white">
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
                            <Link href={`/products/${product.id}/edit`}>
                              <Button variant="outline" size="icon-sm" className="h-7 w-7 border-border/60 group/btn hover:bg-white">
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
                              className="h-7 w-7 border-border/60 group/btn hover:bg-white"
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
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/60" disabled={deleting}>Cancel</AlertDialogCancel>
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
