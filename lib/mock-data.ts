/**
 * Data Service - Connected to Supabase
 * This service provides data from Supabase database instead of mock data
 */

import { dashboardService, productService, categoryService, orderService } from './database'
import type { DashboardStats } from './types'

export interface MockProduct {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  categoryId: string
  category: {
    name: string
  }
  isAvailable: boolean
  isFeatured: boolean
  stockQuantity: number
  sku: string | null
  createdAt: Date
}

export interface MockCategory {
  id: string
  name: string
  description: string | null
  slug: string
  isActive: boolean
  displayOrder: number
  _count: {
    products: number
  }
}

export interface MockOrder {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  totalAmount: number
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED"
  paymentStatus: string
  locationId: string | null
  specialNotes: string | null
  createdAt: Date
  items: Array<{
    id: string
    quantity: number
    price: number
    customizations?: string | null
    product: {
      id: string
      name: string
      imageUrl?: string | null
    }
  }>
}

// Dashboard Statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    return await dashboardService.getStats()
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      lowStockProducts: 0
    }
  }
}

// Products
export async function getProducts() {
  try {
    return await productService.getAll()
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function getProduct(id: string) {
  try {
    return await productService.getById(id)
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Categories
export async function getCategories() {
  try {
    return await categoryService.getAll()
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function getCategory(id: string) {
  try {
    return await categoryService.getById(id)
  } catch (error) {
    console.error('Error fetching category:', error)
    return null
  }
}

// Orders
export async function getOrders() {
  try {
    return await orderService.getAll()
  } catch (error) {
    console.error('Error fetching orders:', error)
    return []
  }
}

export async function getOrder(id: string) {
  try {
    return await orderService.getById(id)
  } catch (error) {
    console.error('Error fetching order:', error)
    return null
  }
}

// Recent Orders for Dashboard
export async function getRecentOrders(limit: number = 10) {
  try {
    return await dashboardService.getRecentOrders(limit)
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return []
  }
}

// Order Status Distribution
export async function getOrdersByStatus() {
  try {
    return await dashboardService.getOrdersByStatus()
  } catch (error) {
    console.error('Error fetching orders by status:', error)
    return []
  }
}

// Revenue Data
export async function getRevenueData(days: number = 30) {
  try {
    return await dashboardService.getRevenueByPeriod(days)
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return []
  }
}

// Fallback mock data for development
export const mockCategories: MockCategory[] = [
  {
    id: "cat-1",
    name: "Coffee",
    description: "Premium coffee drinks",
    slug: "coffee",
    isActive: true,
    displayOrder: 1,
    _count: { products: 5 },
  },
  {
    id: "cat-2",
    name: "Tea",
    description: "Refreshing tea varieties",
    slug: "tea",
    isActive: true,
    displayOrder: 2,
    _count: { products: 3 },
  },
]

export const mockProducts: MockProduct[] = [
  {
    id: "prod-1",
    name: "Espresso Shot",
    description: "Classic espresso shot",
    price: 2.5,
    imageUrl: null,
    categoryId: "cat-1",
    category: { name: "Coffee" },
    isAvailable: true,
    isFeatured: true,
    stockQuantity: 100,
    sku: "COFFEE-001",
    createdAt: new Date(),
  },
]

export const mockOrders: MockOrder[] = [
  {
    id: "order-1",
    orderNumber: "ORD-001",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    customerPhone: "+1234567890",
    totalAmount: 12.5,
    status: "PENDING",
    paymentStatus: "paid",
    locationId: null,
    specialNotes: "Extra hot please",
    createdAt: new Date(),
    items: [
      {
        id: "item-1",
        quantity: 2,
        price: 4.5,
        product: {
          id: "prod-2",
          name: "Cappuccino",
        },
      },
    ],
  },
]

export const mockDashboardStats = {
  totalProducts: 0,
  totalOrders: 0,
  totalRevenue: 0,
  pendingOrders: 0,
  lowStockProducts: 0,
}
