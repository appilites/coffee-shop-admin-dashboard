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
  options: z.array(variationOptionSchema).optional().default([]),
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
