// Loads Razorpay Checkout.js on demand and opens the payment modal.

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Failed to load Razorpay'))
      document.body.appendChild(s)
    })
  }
  return scriptPromise
}

export interface RazorpayOptions {
  key: string
  orderId: string
  amountPaise: number
  currency: string
  name: string
  description?: string
  prefill?: { name?: string; email?: string; contact?: string }
  onSuccess: (response: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) => void
  onDismiss?: () => void
}

export async function openRazorpayCheckout(opts: RazorpayOptions): Promise<void> {
  await loadScript()
  const rzp = new window.Razorpay!({
    key: opts.key,
    order_id: opts.orderId,
    amount: opts.amountPaise,
    currency: opts.currency,
    name: opts.name,
    description: opts.description ?? 'Order payment',
    prefill: opts.prefill ?? {},
    theme: { color: '#18181b' },
    handler: (response: {
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
    }) => opts.onSuccess(response),
    modal: {
      ondismiss: () => opts.onDismiss?.(),
    },
  })
  rzp.open()
}
