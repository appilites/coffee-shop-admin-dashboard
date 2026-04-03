"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download, Eye, Loader2, RefreshCw } from "lucide-react"
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
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { normalizeOrderStatus, type OrderWithItems } from "@/lib/types"

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
  const router = useRouter()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.details || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const parsed: OrderWithItems[] = (Array.isArray(data) ? data : []).map((o: Record<string, unknown>) => ({
        id: o.id as string,
        orderNumber: o.orderNumber as string,
        customerName: o.customerName as string,
        customerEmail: (o.customerEmail as string) || "",
        customerPhone: o.customerPhone as string | undefined,
        totalAmount: Number(o.totalAmount),
        status: normalizeOrderStatus(o.status),
        paymentStatus: String(o.paymentStatus || "pending"),
        specialNotes: o.specialNotes as string | undefined,
        createdAt: new Date(o.createdAt as string),
        updatedAt: new Date((o.updatedAt as string) || (o.createdAt as string)),
        items: Array.isArray(o.items)
          ? o.items.map((item: Record<string, unknown>) => ({
              id: item.id as string,
              quantity: Number(item.quantity),
              price: Number(item.price),
              customizations: item.customizations as OrderWithItems["items"][0]["customizations"],
              product: {
                id: (item.product as { id?: string })?.id || "",
                name: (item.product as { name?: string })?.name || "Item",
                imageUrl: (item.product as { imageUrl?: string | null })?.imageUrl ?? undefined,
              },
            }))
          : [],
      }))
      setOrders(parsed)
    } catch (error) {
      console.error("Error loading orders:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load orders")
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [loadOrders])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadOrders()
    toast.success("Orders refreshed")
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      order.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

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
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Orders</h2>
          <p className="text-muted-foreground mt-1">
            Orders from your shop — refreshed every 30s
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" className="shadow-soft" type="button" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

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
                  placeholder="Search by order #, customer name, or email..."
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

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
                            ? "No orders yet. Checkout on the shop creates order records."
                            : "No orders match your search criteria."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order, index) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/orders/${order.id}`)}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter" && e.key !== " ") return
                            e.preventDefault()
                            router.push(`/orders/${order.id}`)
                          }}
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
                              {order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-xs py-2">
                            {formatCurrency(order.totalAmount)}
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(order.status)} text-[10px] px-1.5 py-0 h-5`}
                            >
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/orders/${order.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                  }}
                                >
                                  <Button
                                    variant="outline"
                                    size="icon-sm"
                                    className="h-6 w-6 border-border/60 group/btn hover:bg-white"
                                  >
                                    <Eye className="h-3 w-3 group-hover/btn:text-[#5d3b2a]" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white text-foreground border border-border/40 shadow-md">
                                <p>View / update order</p>
                              </TooltipContent>
                            </Tooltip>
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
    </div>
  )
}
