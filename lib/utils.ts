/**
 * Utility functions for Admin Dashboard
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

/**
 * Format date
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

/**
 * Generate slug from string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size exceeds 5MB limit.",
    }
  }

  return { valid: true }
}

/**
 * Upload image to public/uploads folder (simulated for UI only)
 */
export async function uploadImage(file: File): Promise<string> {
  // Simulate upload - return a placeholder URL
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create a local object URL for preview
      const objectUrl = URL.createObjectURL(file)
      resolve(objectUrl)
    }, 500)
  })
}
