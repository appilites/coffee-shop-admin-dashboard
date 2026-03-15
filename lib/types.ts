/**
 * TypeScript types for Admin Dashboard
 */

type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED"

export interface AdminSession {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export interface VariationOption {
  id: string
  label: string
  priceModifier: number
}

export interface Variation {
  id: string
  title: string
  type: "checkbox" | "radio"
  options: VariationOption[]
}

export interface ProductFormData {
  name: string
  description?: string
  price: number
  categoryId: string
  imageUrl?: string
  isAvailable: boolean
  isFeatured: boolean
  sku?: string
  variations?: Variation[]
}

export interface CategoryFormData {
  name: string
  description?: string
  isActive: boolean
  parentId?: string | null
}

export interface Category {
  id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
  parent_id: string | null
  created_at: string
  updated_at: string
  parent?: {
    id: string
    name: string
  } | null
  children?: Category[]
}

export interface OrderWithItems {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  totalAmount: number
  status: OrderStatus
  paymentStatus: string
  specialNotes?: string
  createdAt: Date
  updatedAt: Date
  items: Array<{
    id: string
    quantity: number
    price: number
    customizations?: string
    product: {
      id: string
      name: string
      imageUrl?: string
    }
  }>
}

export interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  lowStockProducts: number
}
