import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPaymentSignature } from '@/lib/razorpay'
import { markOrderPaid } from '@/lib/orders'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const razorpayOrderId = typeof body.razorpay_order_id === 'string' ? body.razorpay_order_id : ''
  const razorpayPaymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : ''
  const razorpaySignature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : ''
  const orderId = typeof body.orderId === 'string' ? body.orderId : null

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: 'Missing payment details.' }, { status: 400 })
  }

  const order = await prisma.order.findFirst({
    where: orderId
      ? { OR: [{ id: orderId }, { razorpayOrderId }] }
      : { razorpayOrderId },
  })
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }

  // Idempotent: already paid → success
  if (order.status === 'PAID') {
    return NextResponse.json({ ok: true, orderId: order.id, alreadyPaid: true })
  }

  if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
  }

  const result = await markOrderPaid(order.id, razorpayPaymentId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 })
  }

  return NextResponse.json({ ok: true, orderId: order.id })
}
