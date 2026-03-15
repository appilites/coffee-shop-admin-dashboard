"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockProducts } from "@/data/mock-data"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Package } from "lucide-react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function LowStockAlert() {
  // All products are well stocked - no stock tracking in current data model
  const lowStockProducts: typeof mockProducts = []

  if (lowStockProducts.length === 0) {
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
              <Package className="h-5 w-5 text-accent" />
              Stock Status
            </CardTitle>
            <CardDescription>All products are well stocked</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              No low stock alerts at this time.
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
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Low Stock Alert
          </CardTitle>
          <CardDescription>Products needing restock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lowStockProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center justify-between border-b border-border/40 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-foreground">
                      {product.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-orange-100 text-orange-800 border-orange-200"
                    >
                      Low Stock
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{product.category.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <Link
            href="/products"
            className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            View all products <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}
