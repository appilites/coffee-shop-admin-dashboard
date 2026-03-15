/**
 * Supabase Database Service
 * This replaces Prisma with Supabase for database operations
 */

import { productService, categoryService, orderService } from './database'

// Export services that match the expected Prisma interface
export const prisma = {
  product: {
    findMany: productService.getAll,
    findUnique: ({ where }: { where: { id: string } }) => productService.getById(where.id),
    create: ({ data }: { data: any }) => productService.create(data),
    update: ({ where, data }: { where: { id: string }, data: any }) => productService.update(where.id, data),
    delete: ({ where }: { where: { id: string } }) => productService.delete(where.id),
  },
  category: {
    findMany: categoryService.getAll,
    findUnique: ({ where }: { where: { id: string } }) => categoryService.getById(where.id),
    create: ({ data }: { data: any }) => categoryService.create(data),
    update: ({ where, data }: { where: { id: string }, data: any }) => categoryService.update(where.id, data),
    delete: ({ where }: { where: { id: string } }) => categoryService.delete(where.id),
  },
  order: {
    findMany: orderService.getAll,
    findUnique: ({ where }: { where: { id: string } }) => orderService.getById(where.id),
    update: ({ where, data }: { where: { id: string }, data: any }) => {
      if (data.status) {
        return orderService.updateStatus(where.id, data.status)
      }
      return Promise.resolve({})
    },
  },
} as any
