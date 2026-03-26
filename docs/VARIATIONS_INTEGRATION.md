# Product Variations — Shop Integration Guide

This document explains how product variations work, what data comes from the API, and how to build the complete variations UI and order flow in your customer-facing shop.

---

## Table of Contents

1. [Data Structure](#data-structure)
2. [API Response Example](#api-response-example)
3. [Variation Types](#variation-types)
4. [Price Calculation](#price-calculation)
5. [Shop UI Implementation](#shop-ui-implementation)
6. [Validation (Required vs Optional)](#validation-required-vs-optional)
7. [Building the Order Payload](#building-the-order-payload)
8. [TypeScript Types](#typescript-types)
9. [Complete React Example](#complete-react-example)
10. [Edge Cases](#edge-cases)

---

## Data Structure

Each product returned from `/api/products` or `/api/products/:id` contains a `variations` array stored as `jsonb` in Supabase's `menu_items` table.

### Variation Object

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique variation ID |
| `title` | `string` | Display title shown to customer (e.g. "Size", "Add-ons") |
| `type` | `"radio"` \| `"checkbox"` | How the customer selects options |
| `required` | `boolean` | If `true`, customer **must** select at least one option before adding to cart |
| `options` | `VariationOption[]` | List of selectable options |

### VariationOption Object

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique option ID |
| `label` | `string` | Display text (e.g. "Small", "Large", "Extra Shot") |
| `priceModifier` | `number` | Price added to `base_price` when this option is selected. Can be `0` |

---

## API Response Example

```json
{
  "id": "item-001",
  "name": "Mango Smoothie",
  "base_price": 5.50,
  "loyalty_points_earn": 10,
  "variations": [
    {
      "id": "var-001",
      "title": "Size",
      "type": "radio",
      "required": true,
      "options": [
        { "id": "opt-001", "label": "Small",  "priceModifier": 0    },
        { "id": "opt-002", "label": "Medium", "priceModifier": 0.50 },
        { "id": "opt-003", "label": "Large",  "priceModifier": 1.00 }
      ]
    },
    {
      "id": "var-002",
      "title": "Add-ons",
      "type": "checkbox",
      "required": false,
      "options": [
        { "id": "opt-004", "label": "Extra Shot",   "priceModifier": 0.75 },
        { "id": "opt-005", "label": "Whipped Cream", "priceModifier": 0.50 },
        { "id": "opt-006", "label": "Oat Milk",      "priceModifier": 0.60 }
      ]
    }
  ],
  "calculatedTotalPrice": 6.50,
  "priceRange": {
    "minPrice": 5.50,
    "maxPrice": 7.10
  }
}
```

---

## Variation Types

### `"radio"` — Single Selection
- Customer picks **exactly one** option (like a radio button group)
- Only one option can be active at a time
- If `required: true` → one option must be chosen
- Price: the selected option's `priceModifier` is added to `base_price`

### `"checkbox"` — Multiple Selection
- Customer picks **zero or more** options (like checkboxes)
- Multiple options can be active at the same time
- If `required: true` → at least one option must be checked
- Price: **sum** of all selected options' `priceModifier` values is added to `base_price`

---

## Price Calculation

```ts
function calculateOrderItemPrice(
  basePrice: number,
  variations: Variation[],
  selectedOptions: Record<string, string | string[]>
  // selectedOptions shape:
  //   radio    → { [variationId]: optionId }
  //   checkbox → { [variationId]: optionId[] }
): number {
  let total = basePrice

  for (const variation of variations) {
    const selection = selectedOptions[variation.id]
    if (!selection) continue

    if (variation.type === "radio") {
      const chosen = variation.options.find(o => o.id === selection)
      if (chosen) total += chosen.priceModifier
    } else {
      // checkbox — sum all checked options
      const chosenIds = selection as string[]
      for (const optId of chosenIds) {
        const opt = variation.options.find(o => o.id === optId)
        if (opt) total += opt.priceModifier
      }
    }
  }

  return Math.round(total * 100) / 100 // round to 2 decimal places
}
```

### Price Range (for display before selection)

The API returns pre-computed `priceRange`:
- `minPrice` — base price + minimum radio selections
- `maxPrice` — base price + maximum of all possible selections

Use this to show `"From $5.50"` or `"$5.50 – $7.10"` on product cards.

---

## Shop UI Implementation

### Recommended Component Structure

```
<ProductPage>
  └── <VariationsForm>
        ├── <RadioVariation>   (for type="radio")
        └── <CheckboxVariation> (for type="checkbox")
```

### RadioVariation (single select)

```tsx
function RadioVariation({
  variation,
  value,
  onChange,
}: {
  variation: Variation
  value: string          // selected option id
  onChange: (optionId: string) => void
}) {
  return (
    <div>
      <p className="font-semibold text-sm">
        {variation.title}
        {variation.required && <span className="text-red-500 ml-1">*</span>}
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {variation.options.map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
              value === option.id
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-300 hover:border-primary"
            }`}
          >
            {option.label}
            {option.priceModifier > 0 && (
              <span className="ml-1 text-xs opacity-75">
                +${option.priceModifier.toFixed(2)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### CheckboxVariation (multi-select)

```tsx
function CheckboxVariation({
  variation,
  values,
  onChange,
}: {
  variation: Variation
  values: string[]       // array of selected option ids
  onChange: (optionIds: string[]) => void
}) {
  const toggle = (optionId: string) => {
    if (values.includes(optionId)) {
      onChange(values.filter(id => id !== optionId))
    } else {
      onChange([...values, optionId])
    }
  }

  return (
    <div>
      <p className="font-semibold text-sm">
        {variation.title}
        {variation.required && <span className="text-red-500 ml-1">*</span>}
        {!variation.required && (
          <span className="text-gray-400 text-xs ml-1">(optional)</span>
        )}
      </p>
      <div className="flex flex-col gap-1.5 mt-2">
        {variation.options.map(option => (
          <label
            key={option.id}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={values.includes(option.id)}
              onChange={() => toggle(option.id)}
              className="accent-primary w-4 h-4"
            />
            <span className="text-sm">{option.label}</span>
            {option.priceModifier > 0 && (
              <span className="text-xs text-gray-500">
                +${option.priceModifier.toFixed(2)}
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  )
}
```

---

## Validation (Required vs Optional)

Before allowing the customer to add to cart, validate all variations:

```ts
type SelectedOptions = Record<string, string | string[]>

function validateSelections(
  variations: Variation[],
  selectedOptions: SelectedOptions
): string[] {
  const errors: string[] = []

  for (const variation of variations) {
    if (!variation.required) continue   // skip optional variations

    const selection = selectedOptions[variation.id]

    if (variation.type === "radio") {
      if (!selection || selection === "") {
        errors.push(`Please select a "${variation.title}"`)
      }
    } else {
      // checkbox — at least one must be selected
      if (!selection || (selection as string[]).length === 0) {
        errors.push(`Please select at least one "${variation.title}"`)
      }
    }
  }

  return errors  // empty array = all valid
}

// Usage
const errors = validateSelections(product.variations, selectedOptions)
if (errors.length > 0) {
  alert(errors.join("\n"))
  return
}
// proceed to add to cart
```

---

## Building the Order Payload

When sending an order to your backend, include the selected variations so you can display them in the order summary and calculate the final price server-side:

```ts
interface OrderItemVariation {
  variationId: string
  variationTitle: string
  type: "radio" | "checkbox"
  selectedOptions: {
    optionId: string
    label: string
    priceModifier: number
  }[]
}

function buildOrderItemVariations(
  variations: Variation[],
  selectedOptions: Record<string, string | string[]>
): OrderItemVariation[] {
  return variations
    .map(variation => {
      const selection = selectedOptions[variation.id]
      if (!selection) return null

      const selectedIds =
        variation.type === "radio"
          ? [selection as string]
          : (selection as string[])

      const selectedOpts = selectedIds
        .map(id => variation.options.find(o => o.id === id))
        .filter(Boolean)
        .map(o => ({
          optionId: o!.id,
          label: o!.label,
          priceModifier: o!.priceModifier,
        }))

      if (selectedOpts.length === 0) return null

      return {
        variationId: variation.id,
        variationTitle: variation.title,
        type: variation.type,
        selectedOptions: selectedOpts,
      }
    })
    .filter(Boolean) as OrderItemVariation[]
}

// Final order item payload:
const orderItem = {
  productId: product.id,
  productName: product.name,
  basePrice: product.base_price,
  quantity: 1,
  selectedVariations: buildOrderItemVariations(product.variations, selectedOptions),
  finalPrice: calculateOrderItemPrice(product.base_price, product.variations, selectedOptions),
  loyaltyPointsEarn: product.loyalty_points_earn,
}
```

---

## TypeScript Types

Copy these types into your shop project:

```ts
export interface VariationOption {
  id: string
  label: string
  priceModifier: number
}

export interface Variation {
  id: string
  title: string
  type: "radio" | "checkbox"
  required: boolean
  options: VariationOption[]
}

export interface Product {
  id: string
  name: string
  description: string | null
  base_price: number
  image_url: string | null
  is_available: boolean
  is_featured: boolean
  loyalty_points_earn: number
  loyalty_points_cost: number
  variations: Variation[]
  priceRange: {
    minPrice: number
    maxPrice: number
  }
  category?: {
    id: string
    name: string
    parent_id: string | null
  } | null
}

// State shape for a product's selections
export type SelectedOptions = Record<
  string,           // variation id
  string            // radio: single option id
  | string[]        // checkbox: array of option ids
>
```

---

## Complete React Example

A full working product page with variations, validation, and price calculation:

```tsx
"use client"

import { useState } from "react"

export default function ProductPage({ product }: { product: Product }) {
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({})
  const [errors, setErrors] = useState<string[]>([])

  const handleRadioChange = (variationId: string, optionId: string) => {
    setSelectedOptions(prev => ({ ...prev, [variationId]: optionId }))
    setErrors(prev => prev.filter(e => !e.includes(
      product.variations.find(v => v.id === variationId)?.title ?? ""
    )))
  }

  const handleCheckboxChange = (variationId: string, optionIds: string[]) => {
    setSelectedOptions(prev => ({ ...prev, [variationId]: optionIds }))
    setErrors(prev => prev.filter(e => !e.includes(
      product.variations.find(v => v.id === variationId)?.title ?? ""
    )))
  }

  const currentPrice = calculateOrderItemPrice(
    product.base_price,
    product.variations,
    selectedOptions
  )

  const handleAddToCart = () => {
    const validationErrors = validateSelections(product.variations, selectedOptions)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    const orderItem = {
      productId: product.id,
      productName: product.name,
      basePrice: product.base_price,
      quantity: 1,
      selectedVariations: buildOrderItemVariations(product.variations, selectedOptions),
      finalPrice: currentPrice,
      loyaltyPointsEarn: product.loyalty_points_earn,
    }

    // dispatch to your cart store / context
    addToCart(orderItem)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="text-gray-600">{product.description}</p>

      {/* Price display */}
      <p className="text-xl font-semibold text-primary">
        ${currentPrice.toFixed(2)}
        {product.priceRange.minPrice !== product.priceRange.maxPrice && (
          <span className="text-sm text-gray-400 ml-1 font-normal">
            (${product.priceRange.minPrice.toFixed(2)} – ${product.priceRange.maxPrice.toFixed(2)})
          </span>
        )}
      </p>

      {/* Variations */}
      {product.variations.length > 0 && (
        <div className="space-y-5">
          {product.variations.map(variation => (
            <div key={variation.id}>
              {variation.type === "radio" ? (
                <RadioVariation
                  variation={variation}
                  value={(selectedOptions[variation.id] as string) ?? ""}
                  onChange={(optId) => handleRadioChange(variation.id, optId)}
                />
              ) : (
                <CheckboxVariation
                  variation={variation}
                  values={(selectedOptions[variation.id] as string[]) ?? []}
                  onChange={(optIds) => handleCheckboxChange(variation.id, optIds)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Validation errors */}
      {errors.length > 0 && (
        <ul className="text-red-500 text-sm space-y-1">
          {errors.map((err, i) => <li key={i}>• {err}</li>)}
        </ul>
      )}

      {/* Loyalty hint */}
      {product.loyalty_points_earn > 0 && (
        <p className="text-sm text-amber-600">
          🎁 Earn {product.loyalty_points_earn} loyalty points with this purchase
        </p>
      )}

      <button
        onClick={handleAddToCart}
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm"
      >
        Add to Cart — ${currentPrice.toFixed(2)}
      </button>
    </div>
  )
}
```

---

## Edge Cases

| Situation | Behaviour |
|---|---|
| `variations` is `[]` or missing | No variation UI shown; use `base_price` directly |
| `required: false` | Render the section but skip validation; customer can proceed without selecting |
| `priceModifier: 0` | Do not show "+$0.00" label; only show price modifier if `> 0` |
| Radio with no default selection | Start with empty string `""` — do NOT auto-select the first option unless UX requires it |
| Checkbox with nothing selected and `required: false` | Valid — send empty `selectedVariations` for that variation |
| Product redeemed via loyalty (free) | Set `finalPrice: 0`, skip price modifier display, still save `selectedVariations` for kitchen |
