"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, Package, User, FileText, Loader2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { ProductImage } from "@/components/ui/product-image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { ORDER_STATUS_OPTIONS, normalizeOrderStatus, type OrderStatus } from "@/lib/types"

const STATUS_OPTIONS = ORDER_STATUS_OPTIONS

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

type ApiOrder = {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  totalAmount: number
  taxAmount?: number | null
  status: string
  paymentStatus: string
  paymentIntentId?: string | null
  pickupTime?: string | null
  specialNotes?: string | null
  createdAt: string
  updatedAt: string
  items: Array<{
    id: string
    quantity: number
    price: number
    customizations?: unknown
    product: { id: string; name: string; imageUrl?: string | null }
  }>
}

function formatCustomizations(raw: unknown): string {
  if (raw == null || raw === "") return ""
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw)
      return JSON.stringify(p, null, 2)
    } catch {
      return raw
    }
  }
  if (typeof raw === "object") return JSON.stringify(raw, null, 2)
  return String(raw)
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<ApiOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const id = typeof params.id === "string" ? params.id : params.id?.[0]

  const loadOrder = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${id}`, { cache: "no-store" })
      if (res.status === 404) {
        toast.error("Order not found")
        router.push("/orders")
        return
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.details || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setOrder({
        ...data,
        status: normalizeOrderStatus(data.status),
      })
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : "Failed to load order")
      router.push("/orders")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const handleStatusChange = async (next: OrderStatus) => {
    if (!id || !order) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(
          [data.details, data.hint, data.error].filter(Boolean).join(" — ") || "Update failed"
        )
      }
      const saved = typeof data.status === "string" ? data.status : next
      setOrder((o) => (o ? { ...o, status: normalizeOrderStatus(saved) } : null))
      toast.success("Order status updated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  if (loading || !order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </div>
    )
  }

  const normalizedStatus = normalizeOrderStatus(order.status)
  const lineSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax =
    order.taxAmount != null && !Number.isNaN(Number(order.taxAmount))
      ? Number(order.taxAmount)
      : Math.max(0, order.totalAmount - lineSubtotal)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-4 flex-wrap"
      >
        <Link href="/orders">
          <Button variant="ghost" size="icon" className="h-9 w-9 border-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-3xl font-bold text-foreground">Order {order.orderNumber}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className={`${getStatusColor(normalizedStatus)} text-xs px-2 py-0.5`}>
              {capitalize(normalizedStatus)}
            </Badge>
            <span className="text-muted-foreground text-sm">
              {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Card className="border-border/40 shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Kitchen status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Update status</span>
                  <Select
                    value={STATUS_OPTIONS.includes(normalizedStatus) ? normalizedStatus : "pending"}
                    onValueChange={(v) => handleStatusChange(v as OrderStatus)}
                    disabled={updating}
                  >
                    <SelectTrigger className="bg-background border-border/60 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-[220]">
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {capitalize(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/40">
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
                {order.pickupTime && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Pickup</span>
                    <p className="font-medium">{format(new Date(order.pickupTime), "MMM d, h:mm a")}</p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(order.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Card className="border-border/40 shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Customer
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

        <div className="md:col-span-2 space-y-6">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Card className="border-border/40 shadow-soft">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Line items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 py-3 border-b border-border/40 last:border-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            <ProductImage
                              src={item.product.imageUrl ?? undefined}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-sm shrink-0">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                      {formatCustomizations(item.customizations).length > 0 && (
                        <pre className="text-[11px] leading-snug bg-muted/40 rounded-md p-2 overflow-x-auto text-muted-foreground whitespace-pre-wrap font-sans border border-border/40">
                          {formatCustomizations(item.customizations)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2 pt-4 border-t border-border/40">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal (items)</span>
                    <span>{formatCurrency(lineSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border/40">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

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
                    Special instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic">&quot;{order.specialNotes}&quot;</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
