import crypto from 'crypto'

const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

export function razorpayConfigured(): boolean {
  return Boolean(KEY_ID && KEY_SECRET)
}

// Dev-only escape hatch: complete purchases without Razorpay keys.
// Never active in production builds.
export function fakePayEnabled(): boolean {
  return process.env.DEV_FAKE_PAY === '1' && process.env.NODE_ENV !== 'production'
}

export function razorpayKeyId(): string {
  return KEY_ID ?? ''
}

// Minimal Razorpay REST client — avoids the SDK dependency.
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
): Promise<{ id: string } | null> {
  if (!razorpayConfigured()) return null
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
    }),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { id?: string }
  return data.id ? { id: data.id } : null
}

export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): boolean {
  if (!razorpayConfigured()) return false
  const expected = crypto
    .createHmac('sha256', KEY_SECRET!)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(razorpaySignature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
