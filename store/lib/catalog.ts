import { prisma } from './db'
import type { Prisma } from '@prisma/client'

export type ProductSort = 'newest' | 'price-asc' | 'price-desc' | 'name'

export interface ProductQuery {
  q?: string
  category?: string
  sort?: string
}

const productInclude = {
  category: true,
  images: { orderBy: { position: 'asc' as const }, take: 1 },
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } })
}

export async function getProducts({ q, category, sort }: ProductQuery) {
  const where: Prisma.ProductWhereInput = { active: true }

  if (q) {
    where.name = { contains: q }
  }
  if (category) {
    where.category = { slug: category }
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === 'price-asc'
      ? { pricePaise: 'asc' }
      : sort === 'price-desc'
        ? { pricePaise: 'desc' }
        : sort === 'name'
          ? { name: 'asc' }
          : { createdAt: 'desc' }

  return prisma.product.findMany({
    where,
    orderBy,
    include: productInclude,
  })
}

export async function getFeaturedProducts(take = 8) {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take,
    include: productInclude,
  })
  return products
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { position: 'asc' } },
    },
  })
}
