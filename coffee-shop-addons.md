# Coffee Shop Unified Addons System

## Overview
This document outlines the unified addon system implemented for the coffee shop dashboard. The system extracts addons from specific product categories and standardizes them across all products in those categories.

## Target Categories
The following categories are included in the unified addon system:
- **Tea**
- **Beauty Drinks**
- **Specialty Drinks**
- **Meal Replacement Shakes**
- **Kid Drinks**

## How It Works

### 1. Addon Extraction
The system automatically extracts all unique addons from products in the target categories by:
- Reading existing variations from both the `variations` JSONB column and legacy description field
- Collecting all variation titles and option labels
- Removing duplicates and organizing by category type

### 2. Addon Categorization
Extracted addons are automatically categorized into:

#### **Sizes**
- Small, Medium, Large variations
- Size-related options

#### **Milk Options**
- Regular Milk, Almond Milk, Oat Milk, Soy Milk
- All milk-based alternatives

#### **Sweeteners**
- Sugar, Honey, Stevia
- Sweet-related options

#### **Extras**
- Extra shots, Cream, Syrups
- Additional customizations

#### **Other Options**
- Any addons that don't fit the above categories

### 3. Standardized Application
When applied, the system creates standardized variations for all products:

```json
{
  "variations": [
    {
      "id": "size-variation",
      "title": "Size",
      "type": "radio",
      "required": true,
      "options": [
        {"label": "Small", "priceModifier": 0},
        {"label": "Medium", "priceModifier": 1.0},
        {"label": "Large", "priceModifier": 2.0}
      ]
    },
    {
      "id": "milk-variation",
      "title": "Milk Options",
      "type": "radio",
      "required": false,
      "options": [
        {"label": "Regular Milk", "priceModifier": 0},
        {"label": "Almond Milk", "priceModifier": 0.5},
        {"label": "Oat Milk", "priceModifier": 0.5}
      ]
    }
  ]
}
```

## Usage Instructions

### For Dashboard Admin:
1. Navigate to `/variations` page
2. Click "Extract Addons" to analyze current products
3. Review the extracted addon categories
4. Click "Apply Unified" to standardize all products
5. Use "Download MD" to get this documentation file

### For Shop Integration:
The standardized variations are stored in the `menu_items.variations` JSONB column and can be accessed via the products API:

```javascript
// Get product with variations
const response = await fetch('/api/products/{id}')
const product = await response.json()

// Access variations
product.variations.forEach(variation => {
  console.log(`${variation.title}: ${variation.options.length} options`)
})
```

## Price Calculation
The system automatically calculates price ranges based on variations:
- **Radio buttons (single selection)**: Min = base + cheapest option, Max = base + most expensive option
- **Checkboxes (multiple selection)**: Min = base price, Max = base + all options combined

## Benefits
1. **Consistency**: All products in target categories have the same addon structure
2. **Main