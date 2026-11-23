'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCart } from '@/components/cart-context'
import { formatINR } from '@/lib/format'
import { openRazorpayCheckout } from '@/lib/razorpay-client'

interface QuoteLine {
  productId: string
  slug: string
  name: string
  pricePaise: number
  quantity: number
  lineTotalPaise: number
  stock: number
  imageUrl: string | null
}

interface Quote {
  lines: QuoteLine[]
  subtotalPaise: number
  shippingPaise: number
  taxPaise: number
  totalPaise: number
  errors: { productId: string; message: string }[]
}

interface InitialUser {
  name: string | null
  email: string
}

const inputCls =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:border-zinc-900 focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-zinc-500'

export function CheckoutClient({ user }: { user: InitialUser | null }) {
  const router = useRouter()
  const { items, hydrated, setQuantity, clear } = useCart()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameParts = (user?.name ?? '').split(' ')
  const [firstName, setFirstName] = useState(nameParts[0] ?? '')
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' '))
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pin: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY')

  useEffect(() => {
    if (!hydrated || items.length === 0) return
    let cancelled = false
    fetch('/api/cart/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
      .then((r) => r.json())
      .then((data: Quote) => {
        if (!cancelled) setQuote(data)
      })
      .catch(() => {
        if (!cancelled) setQuote(null)
      })
    return () => {
      cancelled = true
    }
  }, [items, hydrated])

  const lineById = new Map(quote?.lines.map((l) => [l.productId, l]) ?? [])
  const itemCount = items.reduce((s, l) => s + l.quantity, 0)
  const canPay =
    !!quote &&
    quote.lines.length > 0 &&
    quote.errors.length === 0 &&
    !paying &&
    paymentMethod === 'RAZORPAY'

  async function handlePay() {
    setError(null)
    const fullName = `${firstName} ${lastName}`.trim()
    if (!fullName || !email || !phone || !address.line1 || !address.city || !address.state || !/^\d{6}$/.test(address.pin)) {
      setError('Please fill in all required fields (name, email, phone, full address with 6-digit PIN).')
      return
    }
    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }

    setPaying(true)
    try {
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          phone,
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          state: address.state,
          pin: address.pin,
          paymentMethod,
          items,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not create order. Please try again.')
        setPaying(false)
        return
      }

      if (data.mode === 'fake') {
        // Dev mode: no Razorpay — confirm payment instantly
        const vres = await fetch('/api/checkout/verify-fake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderId }),
        })
        const vdata = await vres.json()
        setPaying(false)
        if (vres.ok && vdata.ok) {
          clear()
          router.push(`/order/${data.orderId}/confirmation`)
        } else {
          setError(vdata.error ?? 'Could not confirm order.')
        }
        return
      }

      await openRazorpayCheckout({
        key: data.keyId,
        orderId: data.razorpayOrderId,
        amountPaise: data.amountPaise,
        currency: data.currency,
        name: 'The Store',
        prefill: { name: fullName, email, contact: phone },
        onSuccess: async (rz) => {
          const vres = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.orderId,
              razorpay_order_id: rz.razorpay_order_id,
              razorpay_payment_id: rz.razorpay_payment_id,
              razorpay_signature: rz.razorpay_signature,
            }),
          })
          const vdata = await vres.json()
          setPaying(false)
          if (vres.ok && vdata.ok) {
            clear()
            router.push(`/order/${data.orderId}/confirmation`)
          } else {
            setError(
              vdata.error ??
                'Payment was received but verification failed. Please contact support with your order ID.',
            )
          }
        },
        onDismiss: () => setPaying(false),
      })
    } catch {
      setError('Something went wrong. Please try again.')
      setPaying(false)
    }
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <p className="mt-2 text-sm text-zinc-500">Your cart is empty.</p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Browse products
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Breadcrumb */}
      <div className="border-b border-zinc-100 px-6 py-4">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-900"
        >
          <span aria-hidden="true">‹</span> Home / Checkout
        </Link>
      </div>

      {/* Two-step tabs (visual) */}
      <div className="flex gap-8 border-b border-zinc-100 px-6">
        <div className="flex items-center gap-2 border-b-2 border-zinc-900 pb-3 pt-4 text-sm font-medium text-zinc-900">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-zinc-700">
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 6.5 4.5 9 10 3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Customer Information
        </div>
        <div className="flex items-center gap-2 border-b-2 border-zinc-200 pb-3 pt-4 text-sm text-zinc-400">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300" />
          Payment Details
        </div>
      </div>

      <div className="grid lg:grid-cols-[3fr_2fr]">
        {/* LEFT: form */}
        <div className="flex flex-col gap-8 p-6 sm:p-8">
          <div>
            <h1 className="text-2xl font-bold">Check Out Your Items</h1>
            <p className="mt-1 text-sm text-zinc-500">
              For a better experience, check your item and choose your shipping
              before ordering.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className={labelCls}>
                First Name
              </label>
              <input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputCls}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className={labelCls}>
                Last Name
              </label>
              <input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputCls}
                autoComplete="family-name"
              />
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelCls}>
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
                autoComplete="tel"
                placeholder="+91 …"
              />
            </div>
          </div>

          {/* Delivery address */}
          <fieldset className="rounded-xl border border-zinc-200 p-4">
            <legend className="px-1 text-sm font-medium text-zinc-700">
              Delivery Address
            </legend>
            <div className="mt-2 grid gap-3">
              <input
                aria-label="Address line 1"
                placeholder="House no., street, area"
                value={address.line1}
                onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                className={inputCls}
                autoComplete="address-line1"
              />
              <input
                aria-label="Address line 2 (optional)"
                placeholder="Landmark (optional)"
                value={address.line2}
                onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                className={inputCls}
                autoComplete="address-line2"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  aria-label="City"
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className={inputCls}
                  autoComplete="address-level2"
                />
                <input
                  aria-label="State"
                  placeholder="State"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className={inputCls}
                  autoComplete="address-level1"
                />
                <input
                  aria-label="PIN code"
                  placeholder="PIN code"
                  inputMode="numeric"
                  maxLength={6}
                  value={address.pin}
                  onChange={(e) =>
                    setAddress({ ...address, pin: e.target.value.replace(/\D/g, '') })
                  }
                  className={inputCls}
                  autoComplete="postal-code"
                />
              </div>
            </div>
          </fieldset>

          {/* Payment method */}
          <div>
            <h2 className="text-lg font-semibold">Payment Method</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Select how you want to pay for your items.
            </p>
            <div className="mt-4 flex flex-col gap-3" role="radiogroup" aria-label="Payment method">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-colors ${
                  paymentMethod === 'RAZORPAY'
                    ? 'border-zinc-900 bg-white'
                    : 'border-zinc-200 bg-zinc-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-12 items-center justify-center rounded-md bg-white text-[10px] font-bold tracking-wide text-zinc-800 shadow-sm ring-1 ring-zinc-200">
                    UPI·CARD
                  </span>
                  <span>
                    <span className="block text-sm font-medium">Online Payment</span>
                    <span className="block text-xs text-zinc-500">
                      UPI, Credit/Debit Card, Netbanking (Razorpay)
                    </span>
                  </span>
                </span>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="RAZORPAY"
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={() => setPaymentMethod('RAZORPAY')}
                  className="h-4 w-4 accent-zinc-900"
                />
              </label>

              <label className="flex cursor-not-allowed items-center justify-between rounded-xl border-2 border-zinc-200 bg-zinc-50 p-4 opacity-60">
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-12 items-center justify-center rounded-md bg-white text-lg shadow-sm ring-1 ring-zinc-200">
                    ₹
                  </span>
                  <span>
                    <span className="block text-sm font-medium">
                      Cash on Delivery
                    </span>
                    <span className="block text-xs text-zinc-500">
                      Not available at launch
                    </span>
                  </span>
                </span>
                <input type="radio" disabled className="h-4 w-4" />
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* RIGHT: order summary */}
        <aside className="border-t border-zinc-100 bg-zinc-50 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <h2 className="text-lg font-bold">Current Order</h2>
          <p className="mt-1 text-sm text-zinc-500">
            The sum of all total payments for goods there
          </p>

          <ul className="mt-5 flex flex-col gap-3">
            {items.map((item) => {
              const line = lineById.get(item.productId)
              return (
                <li
                  key={item.productId}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100">
                    {line?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.imageUrl}
                        alt={line.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-zinc-300">
                        {line ? line.name.charAt(0).toUpperCase() : '…'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {line?.name ?? 'Loading…'}
                      </p>
                      <p className="shrink-0 text-sm font-semibold">
                        {line ? formatINR(line.lineTotalPaise) : '—'}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">
                        Quantity : {item.quantity}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            setQuantity(item.productId, item.quantity - 1)
                          }
                          className="flex h-6 w-6 items-center justify-center rounded bg-zinc-100 text-sm hover:bg-zinc-200"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            setQuantity(item.productId, item.quantity + 1)
                          }
                          className="flex h-6 w-6 items-center justify-center rounded bg-zinc-100 text-sm hover:bg-zinc-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          {quote?.errors.map((e, i) => (
            <p key={i} className="mt-3 text-xs text-amber-600">
              ⚠ {e.message}
            </p>
          ))}

          <dl className="mt-5 flex flex-col gap-2 border-t border-zinc-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="font-semibold">Subtotal</dt>
              <dd className="text-lg font-bold">
                {quote ? formatINR(quote.subtotalPaise) : '—'}
              </dd>
            </div>
            <div className="flex justify-between text-zinc-500">
              <dt>Items</dt>
              <dd>{itemCount}x</dd>
            </div>
            <div className="flex justify-between text-zinc-500">
              <dt>Delivery Service</dt>
              <dd>
                {quote
                  ? quote.shippingPaise === 0
                    ? 'Free'
                    : formatINR(quote.shippingPaise)
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between text-zinc-500">
              <dt>Vat (included)</dt>
              <dd>{formatINR(0)}</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold">
              {quote ? formatINR(quote.totalPaise) : '—'}
            </span>
          </div>

          <button
            type="button"
            onClick={handlePay}
            disabled={!canPay}
            className="mt-5 w-full rounded-full bg-zinc-900 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {paying
              ? 'Processing…'
              : quote
                ? `Pay ${formatINR(quote.totalPaise)}`
                : 'Calculating…'}
          </button>
          {!user && (
            <p className="mt-3 text-center text-xs text-zinc-500">
              Checking out as guest.{' '}
              <Link href="/login" className="underline">
                Sign in
              </Link>{' '}
              to track orders in your account.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
