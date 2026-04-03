"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, DollarSign, TrendingUp, Clock, Loader2, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { OrderStatusChart } from "@/components/dashboard/order-status-chart"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { dashboardService } from "@/lib/database"
import { subscribeToAllChanges } from "@/lib/sync"
import type { DashboardStats, DashboardTimeRange } from "@/lib/types"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>("monthly")

  const loadDashboardData = useCallback(async () => {
    try {
      console.log("🔄 Loading dashboard data...")
      const dashboardStats = await dashboardService.getStats(timeRange)
      console.log("📊 Dashboard stats loaded:", dashboardStats)
      setStats(dashboardStats)
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [timeRange])

  useEffect(() => {
    loadDashboardData()

    // Set up real-time subscriptions
    const cleanup = subscribeToAllChanges({
      onOrderChange: (payload) => {
        console.log("New order detected, refreshing stats...")
        loadDashboardData()
        toast.success("New order received!")
      },
      onProductChange: (payload) => {
        console.log("Product updated, refreshing stats...")
        loadDashboardData()
      },
      onCategoryChange: (payload) => {
        console.log("Category updated, refreshing stats...")
        loadDashboardData()
      },
    })

    // Set up periodic updates every 2 minutes as backup
    const interval = setInterval(loadDashboardData, 120000)

    return () => {
      cleanup()
      clearInterval(interval)
    }
  }, [loadDashboardData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    toast.success('Dashboard data refreshed')
  }

  const periodLabel =
    timeRange === "daily" ? "Today" : timeRange === "weekly" ? "Last 7 days" : "This month"

  const statCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      description: "Active coffee shop products",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      description: `Orders (${periodLabel})`,
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      description: `Revenue (${periodLabel})`,
      icon: DollarSign,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders || 0,
      description: `Pending (${periodLabel})`,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
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
          <h2 className="font-serif text-3xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">
            Real-time data from your coffee shop operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Updates
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Range Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Range:</span>
          <Button
            size="sm"
            variant={timeRange === "daily" ? "default" : "outline"}
            onClick={() => setTimeRange("daily")}
          >
            Daily
          </Button>
          <Button
            size="sm"
            variant={timeRange === "weekly" ? "default" : "outline"}
            onClick={() => setTimeRange("weekly")}
          >
            Weekly
          </Button>
          <Button
            size="sm"
            variant={timeRange === "monthly" ? "default" : "outline"}
            onClick={() => setTimeRange("monthly")}
          >
            Monthly
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="border-border/40 shadow-soft hover:shadow-soft-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Coffee Shop Status */}
      {stats && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="border-border/40 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Coffee Shop Status
              </CardTitle>
              <CardDescription>
                Current status of your coffee shop operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold">{stats.totalProducts}</div>
                  <div className="text-xs text-muted-foreground">Menu Items</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold">{stats.pendingOrders}</div>
                  <div className="text-xs text-muted-foreground">Pending Orders</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold">{stats.lowStockProducts}</div>
                  <div className="text-xs text-muted-foreground">Low Stock Items</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">Active</div>
                  <div className="text-xs text-muted-foreground">System Status</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Orders */}
      <div className="grid gap-4 md:grid-cols-1">
        <RecentOrders />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="lg:col-span-2"
        >
          <RevenueChart />
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <OrderStatusChart />
        </motion.div>
      </div>
    </div>
  )
}
