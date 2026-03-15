"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, ChevronRight } from "lucide-react"
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

interface CategoriesTableProps {
  categories: Category[]
  onCategoryDeleted?: () => void
}

export function CategoriesTable({ categories: initialCategories, onCategoryDeleted }: CategoriesTableProps) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Organize categories hierarchically
  const organizeCategories = (cats: Category[]) => {
    const topLevel = cats.filter(cat => !cat.parent_id)
    const children = cats.filter(cat => cat.parent_id)
    
    const organized: (Category & { level: number })[] = []
    
    const addCategory = (category: Category, level: number = 0) => {
      organized.push({ ...category, level })
      
      // Add children
      const categoryChildren = children.filter(child => child.parent_id === category.id)
      categoryChildren
        .sort((a, b) => a.display_order - b.display_order)
        .forEach(child => addCategory(child, level + 1))
    }
    
    topLevel
      .sort((a, b) => a.display_order - b.display_order)
      .forEach(category => addCategory(category))
    
    return organized
  }

  const organizedCategories = organizeCategories(categories)

  const handleDelete = async (category: Category) => {
    setIsDeleting(true)
    
    try {
      // Check if category has children
      const hasChildren = categories.some(cat => cat.parent_id === category.id)
      if (hasChildren) {
        toast.error("Cannot delete category with subcategories. Please delete subcategories first.")
        setIsDeleting(false)
        return
      }

      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }

      setCategories(categories.filter((c) => c.id !== category.id))
      toast.success("Category deleted successfully")
      
      if (onCategoryDeleted) {
        onCategoryDeleted()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete category')
    } finally {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
      setIsDeleting(false)
    }
  }

  const getCategoryName = (category: Category & { level: number }) => {
    const indent = "  ".repeat(category.level)
    const prefix = category.level > 0 ? "└─ " : ""
    return `${indent}${prefix}${category.name}`
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Parent Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No categories found. Create your first category!
                </TableCell>
              </TableRow>
            ) : (
              organizedCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {category.level > 0 && (
                        <div className="flex items-center text-muted-foreground mr-2">
                          {"  ".repeat(category.level - 1)}
                          <ChevronRight className="h-3 w-3 mr-1" />
                        </div>
                      )}
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.parent?.name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {category.description || "—"}
                  </TableCell>
                  <TableCell>
                    {category.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{category.display_order}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/categories/${category.id}/edit`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setCategoryToDelete(category)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category "{categoryToDelete?.name}".
              {categories.some(cat => cat.parent_id === categoryToDelete?.id) && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This category has subcategories. Please delete them first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete && handleDelete(categoryToDelete)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
