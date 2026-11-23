import { NextRequest, NextResponse } from 'next/server'
import { fakePayEnabled } from '@/lib/razorpay'
import { markOrderPaid } from '@/lib/orders'

// Dev-only endpoint: marks a PENDING order PAID without real payment.
// Guarded by DEV_FAKE_PAY=1 and NODE_ENV !== 'production'.
export async function POST(req: NextRequest) {
  if (!fakePayEnabled()) {
    return NextResponse.json({ error: 'Not available.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId : ''
  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId.' }, { status: 400 })
  }

  const result = await markOrderPaid(orderId, 'dev_fake_payment')
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 })
  }

  return NextResponse.json({ ok: true, orderId })
}
