"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  FolderTree, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Loader2, 
  ChevronRight, 
  ChevronDown,
  Folder,
  FolderOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CategoryForm } from "@/components/categories/category-form"
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
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/categories?t=${timestamp}`)
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      console.log('Fetched categories:', data)
      
      // Debug: Check parent-child relationships
      const parents = data.filter((c: Category) => !c.parent_id)
      const children = data.filter((c: Category) => c.parent_id)
      console.log('Parent categories:', parents)
      console.log('Child categories:', children)
      
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete category')
      }

      toast.success("Category deleted successfully")
      setIsDeleteDialogOpen(false)
      setCategoryToDelete(null)
      fetchCategories() // Refresh the list
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  const handleSuccess = () => {
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setCategoryToEdit(null)
    // Force refresh the categories data
    setTimeout(() => {
      fetchCategories()
    }, 100)
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Group categories by parent/child relationship
  const parentCategories = categories.filter(c => !c.parent_id).sort((a, b) => a.display_order - b.display_order)
  const getSubcategories = (parentId: string) => 
    categories.filter(c => c.parent_id === parentId).sort((a, b) => a.display_order - b.display_order)

  const getCategoryStats = (parentId: string) => {
    const subcategories = getSubcategories(parentId)
    return {
      total: subcategories.length,
      active: subcategories.filter(c => c.is_active).length
    }
  }

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
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Categories</h2>
          <p className="text-muted-foreground mt-1">
            Manage product categories and organization
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white">
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>
                Create a new category for your products.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm 
              onSuccess={handleSuccess} 
              onCancel={() => setIsAddModalOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Hierarchical Category Display */}
      <div className="space-y-4">
        {parentCategories.map((parentCategory, index) => {
          const subcategories = getSubcategories(parentCategory.id)
          const isExpanded = expandedCategories.has(parentCategory.id)
          const stats = getCategoryStats(parentCategory.id)

          return (
            <motion.div
              key={parentCategory.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Card className="border-border/40 shadow-soft overflow-hidden">
                {/* Parent Category */}
                <div
                  className={`group relative transition-all duration-200 hover:bg-muted/30 cursor-pointer ${
                    selectedCategoryId === parentCategory.id ? "bg-accent/10" : ""
                  }`}
                  onClick={() => {
                    setSelectedCategoryId(parentCategory.id)
                    if (subcategories.length > 0) {
                      toggleCategoryExpansion(parentCategory.id)
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {subcategories.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleCategoryExpansion(parentCategory.id)
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <div className="w-6" />
                        )}
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <FolderOpen className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Folder className="h-5 w-5 text-blue-600" />
                          )}
                          <CardTitle className="text-lg font-serif">
                            {parentCategory.name}
                          </CardTitle>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {subcategories.length > 0 && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {stats.active}/{stats.total} subcategories
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            parentCategory.is_active
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }
                        >
                          {parentCategory.is_active ? "Active" : "Inactive"}
                        </Badge>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                setCategoryToEdit(parentCategory)
                                setIsEditModalOpen(true)
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCategoryToDelete(parentCategory.id)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                    
                    {parentCategory.description && (
                      <CardDescription className="ml-9 text-sm">
                        {parentCategory.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </div>

                {/* Subcategories */}
                <AnimatePresence>
                  {isExpanded && subcategories.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <CardContent className="pt-0 pb-4">
                        <div className="ml-9 space-y-2">
                          {subcategories.map((subcategory, subIndex) => (
                            <motion.div
                              key={subcategory.id}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: subIndex * 0.05, duration: 0.2 }}
                              className={`group relative p-3 rounded-lg border border-border/40 transition-all duration-200 hover:bg-muted/20 cursor-pointer ${
                                selectedCategoryId === subcategory.id ? "bg-accent/10 border-accent/40" : ""
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCategoryId(subcategory.id)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-l-2 border-b-2 border-muted-foreground/30 ml-2" />
                                  <span className="font-medium text-sm">{subcategory.name}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      subcategory.is_active
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                    }`}
                                  >
                                    {subcategory.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                  
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="bg-white">
                                        <DropdownMenuItem onClick={(e) => {
                                          e.stopPropagation()
                                          setCategoryToEdit(subcategory)
                                          setIsEditModalOpen(true)
                                        }}>
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setCategoryToDelete(subcategory.id)
                                            setIsDeleteDialogOpen(true)
                                          }}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                              
                              {subcategory.description && (
                                <p className="text-xs text-muted-foreground mt-1 ml-6">
                                  {subcategory.description}
                                </p>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information.
            </DialogDescription>
          </DialogHeader>
          {categoryToEdit && (
            <CategoryForm 
              category={categoryToEdit}
              onSuccess={handleSuccess} 
              onCancel={() => setIsEditModalOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => categoryToDelete && handleDelete(categoryToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty State (if no categories) */}
      {categories.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-border/40 shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                No categories yet
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by creating your first category
              </p>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
