import { getSupabaseBrowserClient } from "./supabase"
import type { 
  ProductFormData, 
  CategoryFormData, 
  OrderWithItems, 
  DashboardStats 
} from "./types"

const supabase = getSupabaseBrowserClient()

// Products (Menu Items)
export const productService = {
  async getAll() {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(
          id,
          name,
          parent_id,
          parent:menu_categories!parent_id(
            id,
            name
          )
        )
      `)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(*),
        customizations:customization_options(
          *,
          choices:customization_choices(*)
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(product: ProductFormData) {
    const { variations, ...productData } = product
    
    try {
      console.log('🔍 Creating product with data:', productData)
      
      // Validate required fields
      if (!productData.name) {
        throw new Error('Product name is required')
      }
      if (!productData.price || productData.price <= 0) {
        throw new Error('Valid product price is required')
      }
      if (!productData.categoryId) {
        throw new Error('Category ID is required')
      }

      // Check if category exists first
      console.log('🔍 Checking if category exists:', productData.categoryId)
      const { data: categoryCheck, error: categoryError } = await supabase
        .from('menu_categories')
        .select('id, name')
        .eq('id', productData.categoryId)
        .single()
      
      if (categoryError) {
        console.error('❌ Category check failed:', categoryError)
        throw new Error(`Category validation failed: ${categoryError.message}`)
      }
      
      if (!categoryCheck) {
        throw new Error(`Category with ID "${productData.categoryId}" does not exist`)
      }
      
      console.log('✅ Category exists:', categoryCheck)

      // Prepare insert data
      const insertData = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
        name: productData.name,
        description: productData.description || null,
        base_price: productData.price,
        category_id: productData.categoryId,
        image_url: productData.imageUrl || `/coffee-drink.png`, // Use local default image
        is_available: productData.isAvailable !== false,
        is_featured: productData.isFeatured === true,
        prep_time_minutes: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('🔍 Inserting product data:', insertData)

      const { data, error } = await supabase
        .from('menu_items')
        .insert(insertData)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Product insert failed:', error)
        console.error('❌ Error code:', error.code)
        console.error('❌ Error details:', error.details)
        console.error('❌ Error hint:', error.hint)
        throw new Error(`Database insert failed: ${error.message} (Code: ${error.code})`)
      }

      if (!data) {
        throw new Error('Product was created but no data was returned')
      }

      console.log('✅ Product created successfully:', data)

      // Handle variations/customizations (only if tables exist)
      if (variations && variations.length > 0) {
        console.log('🔍 Processing variations:', variations.length)
        try {
          for (const variation of variations) {
            console.log('🔍 Creating variation:', variation.title)
            const { data: optionData, error: optionError } = await supabase
              .from('customization_options')
              .insert({
                menu_item_id: data.id,
                option_name: variation.title,
                option_type: variation.type === 'radio' ? 'single' : 'multiple',
                is_required: false
              })
              .select()
              .single()

            if (optionError) {
              console.warn('⚠️ Customization options table not available:', optionError)
              break // Skip variations if table doesn't exist
            }

            // Add choices
            for (const option of variation.options) {
              console.log('🔍 Creating choice:', option.label)
              const { error: choiceError } = await supabase
                .from('customization_choices')
                .insert({
                  option_id: optionData.id,
                  choice_name: option.label,
                  price_modifier: option.priceModifier,
                  is_default: false
                })

              if (choiceError) {
                console.warn('⚠️ Customization choices table not available:', choiceError)
                break
              }
            }
          }
        } catch (variationError) {
          console.warn('⚠️ Variations not supported yet:', variationError)
          // Continue without variations - don't fail the product creation
        }
      }

      return data
    } catch (error) {
      console.error('❌ Product creation error:', error)
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error('❌ Error name:', error.name)
        console.error('❌ Error message:', error.message)
        console.error('❌ Error stack:', error.stack)
      } else {
        console.error('❌ Non-Error object thrown:', typeof error, error)
      }
      
      throw error
    }
  },

  async update(id: string, product: Partial<ProductFormData>) {
    const { variations, ...productData } = product
    
    const updateData: any = {}
    if (productData.name) updateData.name = productData.name
    if (productData.description !== undefined) updateData.description = productData.description
    if (productData.price) updateData.base_price = productData.price
    if (productData.categoryId) updateData.category_id = productData.categoryId
    if (productData.imageUrl !== undefined) updateData.image_url = productData.imageUrl
    if (productData.isAvailable !== undefined) updateData.is_available = productData.isAvailable
    if (productData.isFeatured !== undefined) updateData.is_featured = productData.isFeatured
    
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    // Delete customizations first
    await supabase
      .from('customization_options')
      .delete()
      .eq('menu_item_id', id)

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Categories
export const categoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('menu_categories')
      .select(`
        *,
        parent:menu_categories!parent_id(
          id,
          name
        )
      `)
      .order('display_order')
    
    if (error) throw error
    return data || []
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(category: CategoryFormData) {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert({
        name: category.name,
        description: category.description,
        is_active: category.isActive,
        display_order: 999 // Will be updated based on existing categories
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, category: Partial<CategoryFormData>) {
    const updateData: any = {}
    if (category.name) updateData.name = category.name
    if (category.description !== undefined) updateData.description = category.description
    if (category.isActive !== undefined) updateData.is_active = category.isActive
    
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('menu_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Orders
export const orderService = {
  async getAll(): Promise<OrderWithItems[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:menu_items(*)
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Transform data to match OrderWithItems interface
    return (data || []).map((order: any) => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone,
      totalAmount: order.total_amount,
      status: order.status as OrderWithItems['status'],
      paymentStatus: order.payment_status,
      specialNotes: order.special_instructions,
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.unit_price,
        customizations: JSON.stringify(item.customizations || {}),
        product: {
          id: item.product?.id || '',
          name: item.product?.name || item.item_name,
          imageUrl: item.product?.image_url
        }
      }))
    }))
  },

  async getById(id: string): Promise<OrderWithItems | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:menu_items(*)
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    if (!data) return null

    return {
      id: data.id,
      orderNumber: data.order_number,
      customerName: data.customer_name,
      customerEmail: data.customer_email || '',
      customerPhone: data.customer_phone,
      totalAmount: data.total_amount,
      status: data.status as OrderWithItems['status'],
      paymentStatus: data.payment_status,
      specialNotes: data.special_instructions,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      items: (data.items || []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.unit_price,
        customizations: JSON.stringify(item.customizations || {}),
        product: {
          id: item.product?.id || '',
          name: item.product?.name || item.item_name,
          imageUrl: item.product?.image_url
        }
      }))
    }
  },

  async updateStatus(id: string, status: OrderWithItems['status']) {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Dashboard Stats
export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    // Get total products
    const { count: totalProducts } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })

    // Get total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    // Get pending orders
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed', 'preparing'])

    // Get total revenue
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('payment_status', 'paid')

    const totalRevenue = revenueData?.reduce((sum: number, order: any) => sum + order.total_amount, 0) || 0

    return {
      totalProducts: totalProducts || 0,
      totalOrders: totalOrders || 0,
      totalRevenue,
      pendingOrders: pendingOrders || 0,
      lowStockProducts: 0 // This would need inventory tracking
    }
  },

  async getRecentOrders(limit: number = 10) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:menu_items(*)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  async getOrdersByStatus() {
    const { data, error } = await supabase
      .from('orders')
      .select('status')
    
    if (error) throw error
    
    const statusCounts = (data || []).reduce((acc: any, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count: count as number
    }))
  },

  async getRevenueByPeriod(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', startDate.toISOString())
      .order('created_at')
    
    if (error) throw error
    return data || []
  }
}