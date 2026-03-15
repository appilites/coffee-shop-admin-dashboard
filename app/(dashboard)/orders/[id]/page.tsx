"use client"

import { mockOrders } from "@/data/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, Package, User, CreditCard, Calendar, FileText } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { motion } from "framer-motion"

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

const capitalize = (str: string) => {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (params.id) {
      const foundOrder = mockOrders.find((o) => o.id === params.id)
      if (foundOrder) {
        setOrder(foundOrder)
      } else {
        router.push("/orders")
      }
    }
  }, [params.id, router])

  if (!order) return null

  const subtotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.0875

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-4"
      >
        <Link href="/orders">
          <Button variant="ghost" size="icon" className="h-9 w-9 border-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Order {order.orderNumber}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`${getStatusColor(order.status)} text-xs px-2 py-0.5`}>
              {capitalize(order.status)}
            </Badge>
            <span className="text-muted-foreground text-sm">
              {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Order & Customer Info */}
        <div className="md:col-span-1 space-y-6">
          {/* Order Status Card */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Card className="border-border/40 shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Order Summary
                </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className={getStatusColor(order.status)}>
                    {capitalize(order.status)}
                  </Badge>
            </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Payment</span>
                  <Badge
                    variant="outline"
                    className={
                      order.paymentStatus === "paid"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }
                  >
                    {capitalize(order.paymentStatus)}
              </Badge>
            </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                  <span className="text-sm font-medium">Total Amount</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(order.totalAmount)}</span>
              </div>
          </CardContent>
        </Card>
          </motion.div>

          {/* Customer Card */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Card className="border-border/40 shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Customer Details
                </CardTitle>
          </CardHeader>
              <CardContent className="space-y-3">
            <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium">{order.customerName}</p>
            </div>
            <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{order.customerEmail}</p>
            </div>
            {order.customerPhone && (
              <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{order.customerPhone}</p>
              </div>
            )}
          </CardContent>
        </Card>
          </motion.div>
      </div>

        {/* Right Column: Items & Notes */}
        <div className="md:col-span-2 space-y-6">
          {/* Items Card */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Card className="border-border/40 shadow-soft">
        <CardHeader>
                <CardTitle className="font-serif text-xl">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                        <div>
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
              </div>
            ))}
          </div>

                <div className="mt-6 space-y-2 pt-4 border-t border-border/40">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (8.75%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border/40">
              <span>Total</span>
                    <span className="text-[#5d3b2a]">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
          </motion.div>

          {/* Notes Card */}
          {order.specialNotes && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <Card className="border-border/40 shadow-soft">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Special Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic">
                    "{order.specialNotes}"
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
