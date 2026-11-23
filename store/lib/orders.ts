import { prisma } from './db'

// Marks an order PAID and decrements stock atomically. Idempotent:
// calling it on an already-PAID order is a no-op success.
export async function markOrderPaid(
  orderId: string,
  razorpayPaymentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return { ok: false, error: 'Order not found.' }
  if (order.status === 'PAID') return { ok: true }
  if (order.status !== 'PENDING') {
    return { ok: false, error: `Order is ${order.status}, cannot mark paid.` }
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
        if (updated.count === 0) {
          throw new Error(`Insufficient stock for ${item.name}`)
        }
      }
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          razorpayPaymentId,
        },
      })
    })
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not complete order.' }
  }
  return { ok: true }
}
