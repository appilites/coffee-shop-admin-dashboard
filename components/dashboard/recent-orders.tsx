"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { dashboardService } from "@/lib/database"

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

export function RecentOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentOrders()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadRecentOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadRecentOrders = async () => {
    try {
      const recentOrders = await dashboardService.getRecentOrders(5)
      setOrders(recentOrders)
    } catch (error) {
      console.error('Error loading recent orders:', error)
    } finally {
      setLoading(false)
    }
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
          <CardTitle className="text-lg font-serif">Recent Orders</CardTitle>
          <CardDescription>Latest customer orders from coffee shop</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-muted-foreground">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Orders from the coffee shop will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
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
                        {order.order_number || `Order #${order.id.slice(-6)}`}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(order.status)}`}
                      >
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(order.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(order.total_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.items?.length || 0} items
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
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
