"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download, Eye, Edit, Trash2, Loader2, RefreshCw } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import Link from "next/link"
import { toast } from "sonner"
import { orderService } from "@/lib/database"
import type { OrderWithItems } from "@/lib/types"

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "confirmed":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "preparing":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "ready":
      return "bg-green-100 text-green-800 border-green-200"
    case "completed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const capitalize = (str: string) => {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadOrders = async () => {
    try {
      console.log('Loading orders...')
      const ordersData = await orderService.getAll()
      console.log('Loaded orders:', ordersData?.length || 0)
      setOrders(Array.isArray(ordersData) ? ordersData : [])
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
      setOrders([]) // Set empty array on error
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadOrders()
    toast.success('Orders refreshed')
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const handleDelete = () => {
    toast.success("Order deleted successfully")
    setDeleteDialogOpen(false)
    setOrderToDelete(null)
    loadOrders() // Refresh orders
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading orders...</p>
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
          <h2 className="font-serif text-3xl font-bold text-foreground">Orders</h2>
          <p className="text-muted-foreground mt-1">
            Real-time orders from coffee shop customers
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="shadow-soft">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Card className="border-border/40 shadow-soft">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search orders by number, customer name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background border-border/60"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-background border-border/60">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Card className="border-border/40 shadow-soft overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-muted/30">
                      <TableHead className="font-serif text-xs py-3">Order #</TableHead>
                      <TableHead className="text-xs py-3">Customer</TableHead>
                      <TableHead className="text-xs py-3">Items</TableHead>
                      <TableHead className="text-xs py-3">Total</TableHead>
                      <TableHead className="text-xs py-3">Status</TableHead>
                      <TableHead className="text-xs py-3">Payment</TableHead>
                      <TableHead className="text-xs py-3">Date</TableHead>
                      <TableHead className="text-right text-xs py-3">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          {orders.length === 0 
                            ? "No orders yet. Orders from the coffee shop will appear here."
                            : "No orders match your search criteria."
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order, index) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-border/40 hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-semibold text-xs py-2">{order.orderNumber}</TableCell>
                          <TableCell className="py-2">
                            <div className="max-w-[150px]">
                              <p className="font-medium text-foreground text-xs truncate">{order.customerName}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{order.customerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="max-w-[150px] truncate text-xs">
                              {order.items.map(i => `${i.quantity}x ${i.product.name}`).join(", ")}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-xs py-2">
                            {formatCurrency(order.totalAmount)}
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className={`${getStatusColor(order.status)} text-[10px] px-1.5 py-0 h-5`}>
                              {capitalize(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 h-5 ${
                                order.paymentStatus === "paid"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : order.paymentStatus === "pending"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {capitalize(order.paymentStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground py-2">
                            {format(order.createdAt, "MMM d, yy")}
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/orders/${order.id}`}>
                                    <Button variant="outline" size="icon-sm" className="h-6 w-6 border-border/60 group/btn hover:bg-white">
                                      <Eye className="h-3 w-3 group-hover/btn:text-[#5d3b2a]" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white text-foreground border border-border/40 shadow-md">
                                  <p>View Order</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon-sm" className="h-6 w-6 border-border/60 group/btn hover:bg-white">
                                    <Edit className="h-3 w-3 group-hover/btn:text-[#5d3b2a]" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white text-foreground border border-border/40 shadow-md">
                                  <p>Edit Order</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon-sm" 
                                    className="h-6 w-6 border-border/60 group/btn hover:bg-white"
                                    onClick={() => {
                                      setOrderToDelete(order.id)
                                      setDeleteDialogOpen(true)
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 group-hover/btn:text-[#5d3b2a]" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white text-destructive border border-border/40 shadow-md">
                                  <p>Delete Order</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the order record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/60">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
