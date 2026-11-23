'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCart } from '@/components/cart-context'
import { formatINR } from '@/lib/format'

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

export default function CartPage() {
  const { items, hydrated, setQuantity, removeItem } = useCart()
  const [quote, setQuote] = useState<Quote | null>(null)

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
        if (!cancelled) {
          setQuote({
            lines: [],
            subtotalPaise: 0,
            shippingPaise: 0,
            taxPaise: 0,
            totalPaise: 0,
            errors: [
              { productId: '', message: 'Could not calculate totals.' },
            ],
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [items, hydrated])

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-lg bg-zinc-100" />
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-zinc-500">Add some products to get started.</p>
        <Link
          href="/products"
          className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Browse products
        </Link>
      </div>
    )
  }

  const lineById = new Map(quote?.lines.map((l) => [l.productId, l]) ?? [])
  const hasErrors = (quote?.errors.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Your cart</h1>

      {quote?.errors.map((e, i) => (
        <div
          key={i}
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {e.message}{' '}
          <button
            type="button"
            className="underline"
            onClick={() => removeItem(e.productId)}
          >
            Remove
          </button>
        </div>
      ))}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200">
          {items.map((item) => {
            const line = lineById.get(item.productId)
            return (
              <li key={item.productId} className="flex gap-4 p-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100">
                  {line?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={line.imageUrl}
                      alt={line.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-zinc-300">
                      {line ? line.name.charAt(0).toUpperCase() : '…'}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  {line ? (
                    <Link
                      href={`/products/${line.slug}`}
                      className="font-medium hover:underline"
                    >
                      {line.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-zinc-400">
                      {quote === null ? 'Loading…' : 'Unavailable item'}
                    </span>
                  )}
                  <span className="text-sm text-zinc-500">
                    {line ? formatINR(line.pricePaise) : ''}
                    {line && line.stock <= 5 && line.stock > 0 && (
                      <span className="ml-2 text-amber-600">
                        Only {line.stock} left
                      </span>
                    )}
                  </span>
                  <div className="mt-auto flex items-center gap-3">
                    <div className="flex items-center rounded-md border border-zinc-300">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-100"
                        onClick={() =>
                          setQuantity(item.productId, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-100"
                        onClick={() =>
                          setQuantity(item.productId, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-sm text-zinc-500 underline hover:text-red-600"
                      onClick={() => removeItem(item.productId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-right font-medium">
                  {line ? formatINR(line.lineTotalPaise) : '—'}
                </div>
              </li>
            )
          })}
        </ul>

        <aside className="h-fit rounded-lg border border-zinc-200 p-5">
          <h2 className="mb-4 font-semibold">Order summary</h2>
          {quote ? (
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Subtotal</dt>
                <dd>{formatINR(quote.subtotalPaise)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Shipping</dt>
                <dd>
                  {quote.shippingPaise === 0
                    ? 'Free'
                    : formatINR(quote.shippingPaise)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Taxes</dt>
                <dd>Included</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-zinc-200 pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatINR(quote.totalPaise)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-zinc-500">
              {quote === null
                ? 'Calculating totals…'
                : 'Enter quantities to see totals.'}
            </p>
          )}
          {quote && quote.lines.length > 0 && !hasErrors ? (
            <Link
              href="/checkout"
              className="mt-5 block w-full rounded-md bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-700"
            >
              Proceed to checkout
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="mt-5 w-full rounded-md bg-zinc-300 px-4 py-2.5 text-sm font-medium text-white"
            >
              Proceed to checkout
            </button>
          )}
          <p className="mt-2 text-center text-xs text-zinc-500">
            {hasErrors
              ? 'Fix the issues above to check out.'
              : 'Secure checkout with Razorpay.'}
          </p>
        </aside>
      </div>
    </div>
  )
}
