"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Eye, Loader2, Search } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { NewArrival } from "@/lib/validations"
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

export default function NewArrivalsPage() {
  const [newArrivals, setNewArrivals] = useState<NewArrival[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchNewArrivals()
  }, [])

  const fetchNewArrivals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/new-arrivals')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setNewArrivals(data)
    } catch (error) {
      console.error('Error fetching new arrivals:', error)
      toast.error('Failed to load new arrivals')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/new-arrivals/${itemToDelete}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('New arrival deleted successfully')
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      fetchNewArrivals()
    } catch (error) {
      console.error('Error deleting new arrival:', error)
      toast.error('Failed to delete new arrival')
    } finally {
      setDeleting(false)
    }
  }

  const filteredNewArrivals = newArrivals.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading new arrivals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">New Arrivals</h2>
          <p className="text-muted-foreground mt-1">
            Manage your new arrivals section content
          </p>
        </div>
        <Link href="/new-arrivals/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Arrival
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search new arrivals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newArrivals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {newArrivals.filter(item => item.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {newArrivals.filter(item => !item.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Arrivals Grid */}
      {filteredNewArrivals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNewArrivals.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {item.image_url && (
                  <div className="aspect-video relative">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Order: {item.display_order}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/new-arrivals/${item.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/new-arrivals/${item.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setItemToDelete(item.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="font-semibold text-lg mb-2">No new arrivals found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first new arrival'}
            </p>
            <Link href="/new-arrivals/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Arrival
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete New Arrival?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the new arrival item.
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
    </div>
  )
}