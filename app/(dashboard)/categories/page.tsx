"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Folder,
  X,
  Check,
  MoveRight,
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
import { CategoryForm } from "@/components/categories/category-form"
import {
  AlertDialog,
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)

  // Inline subcategory add state
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null)
  const [newSubName, setNewSubName] = useState("")
  const [addingSubLoading, setAddingSubLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIdx, setHighlightedIdx] = useState(-1)
  const subInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchCategories() }, [])

  useEffect(() => {
    if (addingSubFor) {
      setTimeout(() => { subInputRef.current?.focus(); setShowSuggestions(true) }, 50)
    } else {
      setShowSuggestions(false)
      setHighlightedIdx(-1)
    }
  }, [addingSubFor])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        subInputRef.current && !subInputRef.current.contains(e.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories?t=${Date.now()}`)
      if (!response.ok) throw new Error('Failed to fetch categories')
      setCategories(await response.json())
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(data?.error || 'Failed to delete category')
        return
      }
      toast.success("Category deleted successfully")
      setIsDeleteDialogOpen(false)
      setCategoryToDelete(null)
      fetchCategories()
    } catch {
      toast.error('Failed to delete category. Please try again.')
    }
  }

  // Create a brand-new subcategory
  const handleCreateSub = async (name: string, parentId: string) => {
    setAddingSubLoading(true)
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), isActive: true, parentId }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(data?.error || 'Failed to add subcategory')
        return
      }
      toast.success(`"${name.trim()}" added as subcategory`)
      setNewSubName("")
      setShowSuggestions(true)
      fetchCategories()
      setTimeout(() => subInputRef.current?.focus(), 50)
    } catch {
      toast.error('Failed to add subcategory')
    } finally {
      setAddingSubLoading(false)
    }
  }

  // Move an existing category to become a subcategory of parentId
  const handleAssignExisting = async (cat: Category, parentId: string) => {
    setAddingSubLoading(true)
    try {
      const response = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cat.name,
          isActive: cat.is_active,
          parentId,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(data?.error || 'Failed to assign category')
        return
      }
      toast.success(`"${cat.name}" moved under this category`)
      setNewSubName("")
      setShowSuggestions(true)
      fetchCategories()
      setTimeout(() => subInputRef.current?.focus(), 50)
    } catch {
      toast.error('Failed to assign category')
    } finally {
      setAddingSubLoading(false)
    }
  }

  const handleSuccess = () => {
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setCategoryToEdit(null)
    setTimeout(() => fetchCategories(), 100)
  }

  const parentCategories = categories
    .filter(c => !c.parent_id)
    .sort((a, b) => a.display_order - b.display_order)

  const getSubcategories = (parentId: string) =>
    categories
      .filter(c => c.parent_id === parentId)
      .sort((a, b) => a.display_order - b.display_order)

  // Suggestions: existing categories not already under this parent, filtered by input
  const getSuggestions = (parentId: string) => {
    const query = newSubName.trim().toLowerCase()
    return categories.filter(c =>
      c.parent_id !== parentId &&       // not already a sub of this parent
      c.id !== parentId &&              // not the parent itself
      (query === "" || c.name.toLowerCase().includes(query))
    )
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
            Manage product categories and subcategories
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Parent Category</DialogTitle>
              <DialogDescription>
                Create a new top-level category. Add subcategories to it from the list.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              onSuccess={handleSuccess}
              onCancel={() => setIsAddModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Category Cards */}
      <div className="space-y-4">
        {parentCategories.map((parentCategory, index) => {
          const subcategories = getSubcategories(parentCategory.id)
          const isAddingHere = addingSubFor === parentCategory.id
          const suggestions = isAddingHere ? getSuggestions(parentCategory.id) : []
          const trimmed = newSubName.trim()
          // Show "Create new" option only if the typed name doesn't exactly match an existing category
          const exactMatch = suggestions.find(s => s.name.toLowerCase() === trimmed.toLowerCase())
          const showCreateNew = trimmed.length > 0 && !exactMatch
          const allItems = showCreateNew
            ? [{ type: "create" as const }, ...suggestions.map(s => ({ type: "existing" as const, cat: s }))]
            : suggestions.map(s => ({ type: "existing" as const, cat: s }))

          return (
            <motion.div
              key={parentCategory.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              className={`relative ${isAddingHere ? "z-20" : "z-0"}`}
            >
              <Card className="border-border/40 shadow-soft overflow-visible">
                {/* Parent Category Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-primary/70 shrink-0" />
                      <CardTitle className="text-lg font-serif">
                        {parentCategory.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
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
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Edit category"
                        onClick={() => { setCategoryToEdit(parentCategory); setIsEditModalOpen(true) }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Delete category"
                        onClick={() => { setCategoryToDelete(parentCategory.id); setIsDeleteDialogOpen(true) }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {parentCategory.description && (
                    <CardDescription className="ml-7 text-sm">
                      {parentCategory.description}
                    </CardDescription>
                  )}
                </CardHeader>

                {/* Subcategories + Inline Add */}
                <CardContent className="pt-0 pb-4">
                  <div className="ml-7 space-y-2">
                    {/* Existing subcategories */}
                    <AnimatePresence initial={false}>
                      {subcategories.map((sub) => (
                        <motion.div
                          key={sub.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-l-2 border-b-2 border-muted-foreground/30 shrink-0" />
                            <span className="text-sm font-medium">{sub.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                sub.is_active
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              {sub.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="ghost" size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              title="Edit subcategory"
                              onClick={() => { setCategoryToEdit(sub); setIsEditModalOpen(true) }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              title="Remove subcategory"
                              onClick={() => { setCategoryToDelete(sub.id); setIsDeleteDialogOpen(true) }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Inline Add Subcategory with Suggestions */}
                    <AnimatePresence>
                      {isAddingHere && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="relative z-20"
                        >
                          {/* Input row */}
                          <div                           className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
                            <div className="w-3 h-3 border-l-2 border-b-2 border-muted-foreground/40 shrink-0" />
                            <Input
                              ref={subInputRef}
                              value={newSubName}
                              onChange={(e) => {
                                setNewSubName(e.target.value)
                                setShowSuggestions(true)
                                setHighlightedIdx(-1)
                              }}
                              onFocus={() => setShowSuggestions(true)}
                              placeholder="Type to search or create subcategory..."
                              className="h-8 text-sm bg-background border-border/60 focus-visible:ring-ring/50"
                              onKeyDown={(e) => {
                                if (e.key === "ArrowDown") {
                                  e.preventDefault()
                                  setHighlightedIdx(i => Math.min(i + 1, allItems.length - 1))
                                } else if (e.key === "ArrowUp") {
                                  e.preventDefault()
                                  setHighlightedIdx(i => Math.max(i - 1, -1))
                                } else if (e.key === "Enter") {
                                  e.preventDefault()
                                  if (highlightedIdx >= 0 && allItems[highlightedIdx]) {
                                    const item = allItems[highlightedIdx]
                                    if (item.type === "create") handleCreateSub(newSubName, parentCategory.id)
                                    else handleAssignExisting(item.cat, parentCategory.id)
                                  } else if (trimmed) {
                                    handleCreateSub(newSubName, parentCategory.id)
                                  }
                                } else if (e.key === "Escape") {
                                  if (showSuggestions) {
                                    setShowSuggestions(false)
                                  } else {
                                    setAddingSubFor(null)
                                    setNewSubName("")
                                  }
                                }
                              }}
                              disabled={addingSubLoading}
                            />
                            {/* Confirm button */}
                            <Button
                              size="sm"
                              className="h-8 px-3 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                              onClick={() => {
                                if (trimmed) handleCreateSub(newSubName, parentCategory.id)
                              }}
                              disabled={!trimmed || addingSubLoading}
                              title="Add as new subcategory"
                            >
                              {addingSubLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            {/* Close button */}
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                              onClick={() => { setAddingSubFor(null); setNewSubName("") }}
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {/* Suggestions dropdown */}
                          {showSuggestions && allItems.length > 0 && (
                            <div
                              ref={suggestionsRef}
                              className="absolute left-0 right-0 top-full mt-1 z-[500] bg-white border-2 border-border rounded-lg shadow-soft-lg overflow-hidden"
                            >
                              <div className="px-3 py-2 border-b border-border bg-muted">
                                <p className="text-xs text-foreground font-semibold uppercase tracking-wide">
                                  {trimmed ? "Suggestions" : "All categories"}
                                </p>
                              </div>
                              <div className="max-h-52 overflow-y-auto bg-white">
                                {allItems.map((item, idx) => (
                                  <button
                                    key={idx}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left border-b border-border/30 last:border-0 transition-colors ${
                                      highlightedIdx === idx
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-white hover:bg-muted text-foreground"
                                    }`}
                                    onMouseEnter={() => setHighlightedIdx(idx)}
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      if (item.type === "create") {
                                        handleCreateSub(newSubName, parentCategory.id)
                                      } else {
                                        handleAssignExisting(item.cat, parentCategory.id)
                                      }
                                    }}
                                  >
                                    {item.type === "create" ? (
                                      <>
                                        <Plus className={`h-3.5 w-3.5 shrink-0 ${highlightedIdx === idx ? "text-primary-foreground" : "text-primary"}`} />
                                        <span className="flex-1">
                                          Create <span className="font-bold">"{trimmed}"</span>
                                        </span>
                                        <Badge className="ml-auto text-xs bg-primary/20 text-primary border-0 font-semibold">
                                          New
                                        </Badge>
                                      </>
                                    ) : (
                                      <>
                                        <MoveRight className={`h-3.5 w-3.5 shrink-0 ${highlightedIdx === idx ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
                                        <span className="flex-1 font-medium">{item.cat.name}</span>
                                        <Badge className={`ml-auto text-xs border-0 font-medium ${
                                          highlightedIdx === idx
                                            ? "bg-primary-foreground/20 text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                        }`}>
                                          {item.cat.parent_id ? "Sub" : "Parent"}
                                        </Badge>
                                      </>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Add Subcategory trigger */}
                    {!isAddingHere && (
                      <button
                        className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary font-medium mt-1 px-1 py-0.5 rounded hover:bg-primary/5 transition-colors"
                        onClick={() => {
                          setAddingSubFor(parentCategory.id)
                          setNewSubName("")
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Subcategory
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category information.</DialogDescription>
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open)
        if (!open) setCategoryToDelete(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category. Categories with subcategories or products cannot be deleted — remove them first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setCategoryToDelete(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={async () => {
                if (categoryToDelete) await handleDelete(categoryToDelete)
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty State */}
      {categories.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
