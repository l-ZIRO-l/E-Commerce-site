import { prisma } from './db'
import { shippingFor } from './shipping'

export interface CartItemInput {
  productId: string
  quantity: number
}

export interface PricedLine {
  productId: string
  slug: string
  name: string
  pricePaise: number
  quantity: number
  lineTotalPaise: number
  stock: number
  imageUrl: string | null
}

export interface CartError {
  productId: string
  reason: 'not_found' | 'out_of_stock' | 'invalid_quantity'
  message: string
}

export interface CartQuote {
  lines: PricedLine[]
  subtotalPaise: number
  shippingPaise: number
  taxPaise: number
  totalPaise: number
  errors: CartError[]
}

// Server-side source of truth for cart totals. Never trust client prices.
export async function computeCartQuote(
  rawItems: unknown,
): Promise<CartQuote> {
  const requested = new Map<string, number>()
  const errors: CartError[] = []

  const list = Array.isArray(rawItems) ? rawItems : []
  for (const raw of list) {
    const item = raw as CartItemInput
    if (
      !item ||
      typeof item.productId !== 'string' ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      errors.push({
        productId: 'unknown',
        reason: 'invalid_quantity',
        message: 'Invalid cart line ignored.',
      })
      continue
    }
    requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity)
  }

  const lines: PricedLine[] = []
  let subtotalPaise = 0

  if (requested.size > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: [...requested.keys()] }, active: true },
      include: { images: { orderBy: { position: 'asc' }, take: 1 } },
    })
    const byId = new Map(products.map((p) => [p.id, p]))

    for (const [productId, quantity] of requested) {
      const product = byId.get(productId)
      if (!product) {
        errors.push({
          productId,
          reason: 'not_found',
          message: 'This product is no longer available.',
        })
        continue
      }
      if (quantity > product.stock) {
        errors.push({
          productId,
          reason: 'out_of_stock',
          message: `Only ${product.stock} left in stock.`,
        })
        continue
      }
      const lineTotalPaise = product.pricePaise * quantity
      subtotalPaise += lineTotalPaise
      lines.push({
        productId,
        slug: product.slug,
        name: product.name,
        pricePaise: product.pricePaise,
        quantity,
        lineTotalPaise,
        stock: product.stock,
        imageUrl: product.images[0]?.url ?? null,
      })
    }
  }

  const shippingPaise = shippingFor(subtotalPaise)
  return {
    lines,
    subtotalPaise,
    shippingPaise,
    taxPaise: 0,
    totalPaise: subtotalPaise + shippingPaise,
    errors,
  }
}
