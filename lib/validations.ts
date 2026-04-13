/**
 * Zod validation schemas for forms
 */

import { z } from "zod"

// Variation option schema
const variationOptionSchema = z.object({
  id: z.string(),
  label: z.string().optional().default(""),
  priceModifier: z.coerce.number().default(0),
})

// Variation schema
const variationSchema = z.object({
  id: z.string(),
  title: z.string().optional().default(""),
  type: z.enum(["checkbox", "radio"]),
  required: z.boolean().default(true),
  options: z.array(variationOptionSchema).optional().default([]),
  /** Checkbox: first N selections do not add extraSelectionPrice; beyond N, each adds this fee (plus option modifiers). */
  maxIncludedSelections: z.number().int().min(0).max(99).optional(),
  extraSelectionPrice: z.number().min(0).max(999).optional(),
})

// Product validation schema
export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200, "Name is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  price: z.number().min(0.01, "Price must be greater than 0").max(1000, "Price is too high"),
  categoryId: z.string().min(1, "Category is required"),
  imageUrl: z.string().max(2000, "Image URL is too long").optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sku: z.string().max(50, "SKU is too long").optional(),
  variations: z.array(variationSchema).optional().default([]),
  loyaltyPointsEarn: z.coerce.number().int().min(0).default(0),
})

export type ProductFormValues = z.infer<typeof productSchema>

// Category validation schema
export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  isActive: z.boolean().default(true),
  parentId: z.string().optional().nullable(),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export type LoginFormValues = z.infer<typeof loginSchema>

// New Arrival validation schema
export const newArrivalSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  imageUrl: z.string().max(2000, "Image URL is too long").optional().or(z.literal("")),
  buttonText: z.string().min(1, "Button text is required").max(50, "Button text is too long"),
  redirectLink: z.string().max(500, "Redirect link is too long").optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
})

export type NewArrivalFormValues = z.infer<typeof newArrivalSchema>

// New Arrival interface
export interface NewArrival {
  id: string
  title: string
  description: string | null
  image_url: string | null
  button_text: string
  redirect_link: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}
