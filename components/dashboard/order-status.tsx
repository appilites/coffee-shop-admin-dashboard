"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockOrders } from "@/data/mock-data"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "CONFIRMED":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "PREPARING":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "READY":
      return "bg-green-100 text-green-800 border-green-200"
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export function OrderStatus() {
  // Get orders by status, prioritizing active statuses
  const statusOrder = ["PENDING", "PREPARING", "READY", "CONFIRMED", "COMPLETED", "CANCELLED"]
  const ordersByStatus = statusOrder.map((status) => ({
    status,
    orders: mockOrders
      .filter((o) => o.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  })).filter((group) => group.orders.length > 0)

  // Get the most relevant status group (prioritize active orders)
  const activeStatusGroups = ordersByStatus.filter(
    (g) => ["PENDING", "PREPARING", "READY", "CONFIRMED"].includes(g.status)
  )
  const displayGroup = activeStatusGroups.length > 0 ? activeStatusGroups[0] : ordersByStatus[0]

  if (!displayGroup || displayGroup.orders.length === 0) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
      >
        <Card className="border-border/40 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-accent" />
              Order Status
            </CardTitle>
            <CardDescription>No active orders at this time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              No orders found.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="border-border/40 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-accent" />
            Order Status - {displayGroup.status}
          </CardTitle>
          <CardDescription>Orders requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayGroup.orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center justify-between border-b border-border/40 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-foreground">
                      {order.orderNumber}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(order.createdAt), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-xs text-muted-foreground">{order.items.length} items</p>
                </div>
              </motion.div>
            ))}
          </div>
          <Link
            href="/orders"
            className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            View all orders <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}
