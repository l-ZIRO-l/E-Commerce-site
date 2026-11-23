import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeCartQuote } from '@/lib/pricing'
import { getSessionUser } from '@/lib/auth'
import {
  createRazorpayOrder,
  fakePayEnabled,
  razorpayConfigured,
  razorpayKeyId,
} from '@/lib/razorpay'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

  const email = str(body.email)
  const name = str(body.name)
  const phone = str(body.phone)
  const line1 = str(body.line1)
  const line2 = str(body.line2) || null
  const city = str(body.city)
  const state = str(body.state)
  const pin = str(body.pin)
  const paymentMethod = str(body.paymentMethod).toUpperCase()
  const items = body.items

  const missing: string[] = []
  if (!name) missing.push('name')
  if (!EMAIL_RE.test(email)) missing.push('valid email')
  if (!phone) missing.push('phone')
  if (!line1) missing.push('address line 1')
  if (!city) missing.push('city')
  if (!state) missing.push('state')
  if (!/^\d{6}$/.test(pin)) missing.push('6-digit PIN code')
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing or invalid: ${missing.join(', ')}` },
      { status: 400 },
    )
  }
  if (paymentMethod === 'COD') {
    return NextResponse.json(
      { error: 'Cash on delivery is not available yet.' },
      { status: 400 },
    )
  }
  if (paymentMethod !== 'RAZORPAY') {
    return NextResponse.json(
      { error: 'Unsupported payment method.' },
      { status: 400 },
    )
  }

  const quote = await computeCartQuote(items)
  if (quote.errors.length > 0) {
    return NextResponse.json(
      { error: 'Some items in your cart are unavailable.', errors: quote.errors },
      { status: 400 },
    )
  }
  if (quote.lines.length === 0 || quote.totalPaise <= 0) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 })
  }

  // Optional: link order to logged-in user
  const user = await getSessionUser()

  const order = await prisma.order.create({
    data: {
      userId: user?.id ?? null,
      email,
      status: 'PENDING',
      paymentMethod: 'RAZORPAY',
      subtotalPaise: quote.subtotalPaise,
      shippingPaise: quote.shippingPaise,
      taxPaise: quote.taxPaise,
      totalPaise: quote.totalPaise,
      shippingName: name,
      shippingPhone: phone,
      shippingLine1: line1,
      shippingLine2: line2,
      shippingCity: city,
      shippingState: state,
      shippingPin: pin,
      items: {
        create: quote.lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          pricePaise: l.pricePaise,
          quantity: l.quantity,
        })),
      },
    },
  })

  // Dev-only: skip Razorpay entirely, client will call /api/checkout/verify-fake
  if (fakePayEnabled()) {
    return NextResponse.json({
      mode: 'fake',
      orderId: order.id,
      amountPaise: quote.totalPaise,
      currency: 'INR',
    })
  }

  if (!razorpayConfigured()) {
    return NextResponse.json(
      {
        error:
          'Online payments are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to store/.env.',
        orderId: order.id,
      },
      { status: 503 },
    )
  }

  const rzOrder = await createRazorpayOrder(quote.totalPaise, order.id)
  if (!rzOrder) {
    return NextResponse.json(
      { error: 'Could not create payment order. Please try again.', orderId: order.id },
      { status: 502 },
    )
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { razorpayOrderId: rzOrder.id },
  })

  return NextResponse.json({
    orderId: order.id,
    razorpayOrderId: rzOrder.id,
    amountPaise: quote.totalPaise,
    currency: 'INR',
    keyId: razorpayKeyId(),
    customer: { name, email, phone },
  })
}
