import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient()
    
    console.log('🚀 Adding coffee shop variations to existing products...')

    // Get all existing products
    const { data: products, error: productsError } = await supabase
      .from('menu_items')
      .select('*')

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch products',
        details: productsError 
      }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No products found to update' 
      }, { status: 400 })
    }

    // Define common coffee shop variations
    const coffeeVariations = [
      {
        id: "size-variation",
        title: "Size",
        type: "radio",
        options: [
          { id: "size-small", label: "Small (8oz)", priceModifier: 0 },
          { id: "size-medium", label: "Medium (12oz)", priceModifier: 0.50 },
          { id: "size-large", label: "Large (16oz)", priceModifier: 1.00 }
        ]
      },
      {
        id: "milk-variation",
        title: "Milk Options",
        type: "radio",
        options: [
          { id: "milk-regular", label: "Regular Milk", priceModifier: 0 },
          { id: "milk-almond", label: "Almond Milk", priceModifier: 0.60 },
          { id: "milk-oat", label: "Oat Milk", priceModifier: 0.65 },
          { id: "milk-soy", label: "Soy Milk", priceModifier: 0.55 },
          { id: "milk-coconut", label: "Coconut Milk", priceModifier: 0.60 }
        ]
      },
      {
        id: "addons-variation",
        title: "Add-ons",
        type: "checkbox",
        options: [
          { id: "addon-extra-shot", label: "Extra Shot", priceModifier: 0.75 },
          { id: "addon-decaf", label: "Make it Decaf", priceModifier: 0 },
          { id: "addon-extra-hot", label: "Extra Hot", priceModifier: 0 },
          { id: "addon-whipped-cream", label: "Whipped Cream", priceModifier: 0.50 },
          { id: "addon-vanilla-syrup", label: "Vanilla Syrup", priceModifier: 0.50 },
          { id: "addon-caramel-syrup", label: "Caramel Syrup", priceModifier: 0.50 },
          { id: "addon-hazelnut-syrup", label: "Hazelnut Syrup", priceModifier: 0.50 }
        ]
      }
    ]

    // Calculate price range for coffee variations
    const calculateCoffeePriceRange = (basePrice: number) => {
      let minPrice = basePrice // Small + Regular Milk + No add-ons
      let maxPrice = basePrice + 1.00 + 0.65 + (0.75 + 0.50 + 0.50 + 0.50 + 0.50) // Large + Oat Milk + All add-ons
      return { minPrice, maxPrice }
    }

    const updatedProducts = []
    let updateCount = 0

    for (const product of products) {
      try {
        // Skip if product already has variations
        if (product.description && product.description.includes('[VARIATIONS:')) {
          console.log(`Skipping ${product.name} - already has variations`)
          continue
        }

        // Calculate prices
        const basePrice = product.base_price || 0
        const priceRange = calculateCoffeePriceRange(basePrice)
        const calculatedTotalPrice = basePrice + 2.85 // Base + all max options

        // Prepare variations and price data
        const variationsJson = JSON.stringify(coffeeVariations)
        const priceData = {
          calculatedTotalPrice,
          priceRange
        }
        const priceDataJson = JSON.stringify(priceData)

        // Update description with variations and prices
        const originalDescription = product.description || ""
        const newDescription = originalDescription + 
          (originalDescription ? "\n\n" : "") + 
          `[VARIATIONS:${variationsJson}]` +
          `[PRICES:${priceDataJson}]`

        // Update the product
        const { data: updatedProduct, error: updateError } = await supabase
          .from('menu_items')
          .update({
            description: newDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
          .select()
          .single()

        if (updateError) {
          console.error(`Error updating product ${product.name}:`, updateError)
          continue
        }

        console.log(`✅ Updated ${product.name} with coffee variations`)
        updatedProducts.push(updatedProduct)
        updateCount++

      } catch (error) {
        console.error(`Error processing product ${product.name}:`, error)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added coffee variations to ${updateCount} products`,
      updatedCount: updateCount,
      totalProducts: products.length,
      updatedProducts: updatedProducts.map(p => ({ id: p.id, name: p.name }))
    })

  } catch (error) {
    console.error('Error adding coffee variations:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}