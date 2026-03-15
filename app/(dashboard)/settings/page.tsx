"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export default function SettingsPage() {

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Settings</h2>
          <p className="text-muted-foreground mt-1">
            Manage your products, categories, and orders
          </p>
        </div>
      </motion.div>

      {/* Management Instructions */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <Card className="border-border/40 shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Data Management</CardTitle>
            </div>
            <CardDescription>
              Manage your coffee shop data directly from the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                <h4 className="font-medium mb-2 text-green-900">📦 Products</h4>
                <p className="text-sm text-green-700 mb-3">
                  Add, edit, and manage menu items, prices, and availability
                </p>
                <Button 
                  onClick={() => window.location.href = '/products'}
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-100"
                >
                  Manage Products
                </Button>
              </div>

              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900">📂 Categories</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Organize products into categories and subcategories
                </p>
                <Button 
                  onClick={() => window.location.href = '/categories'}
                  variant="outline"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Manage Categories
                </Button>
              </div>

              <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
                <h4 className="font-medium mb-2 text-purple-900">🛒 Orders</h4>
                <p className="text-sm text-purple-700 mb-3">
                  View and manage customer orders and order status
                </p>
                <Button 
                  onClick={() => window.location.href = '/orders'}
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  Manage Orders
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  )
}