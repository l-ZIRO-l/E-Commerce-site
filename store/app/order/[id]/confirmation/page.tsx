import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import { formatINR } from '@/lib/format'

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  SHIPPED: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-zinc-200 text-zinc-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-purple-100 text-purple-800',
}

async function Confirmation({ orderId }: { orderId: string }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 10.5 8 14.5 16 5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <h1 className="text-xl font-bold">
              {order.status === 'PAID'
                ? 'Payment successful'
                : 'Order received'}
            </h1>
            <p className="text-sm text-zinc-500">
              Order #{order.id.slice(-8).toUpperCase()}
            </p>
          </div>
          <span
            className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${statusStyles[order.status] ?? 'bg-zinc-100'}`}
          >
            {order.status}
          </span>
        </div>

        {order.status === 'PENDING' && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This order is awaiting payment confirmation. If you completed the
            payment, it will update automatically — refresh in a moment.
          </p>
        )}

        <h2 className="mt-6 font-semibold">Items</h2>
        <ul className="mt-2 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between px-4 py-3 text-sm">
              <span>
                {item.name} <span className="text-zinc-400">× {item.quantity}</span>
              </span>
              <span className="font-medium">
                {formatINR(item.pricePaise * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-zinc-500">
            <dt>Subtotal</dt>
            <dd>{formatINR(order.subtotalPaise)}</dd>
          </div>
          <div className="flex justify-between text-zinc-500">
            <dt>Shipping</dt>
            <dd>
              {order.shippingPaise === 0 ? 'Free' : formatINR(order.shippingPaise)}
            </dd>
          </div>
          <div className="mt-1 flex justify-between border-t border-zinc-200 pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatINR(order.totalPaise)}</dd>
          </div>
        </dl>

        <h2 className="mt-6 font-semibold">Delivery address</h2>
        <address className="mt-1 text-sm not-italic text-zinc-600">
          {order.shippingName}
          <br />
          {order.shippingLine1}
          {order.shippingLine2 ? `, ${order.shippingLine2}` : ''}
          <br />
          {order.shippingCity}, {order.shippingState} — {order.shippingPin}
          <br />
          {order.shippingPhone} · {order.email}
        </address>

        <div className="mt-8 flex gap-3">
          <Link
            href="/products"
            className="flex-1 rounded-md border border-zinc-300 px-4 py-2.5 text-center text-sm font-medium hover:bg-zinc-50"
          >
            Continue shopping
          </Link>
          <Link
            href="/account"
            className="flex-1 rounded-md bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-700"
          >
            View my orders
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense
      fallback={<div className="h-96 animate-pulse rounded-2xl bg-zinc-100" />}
    >
      <ConfirmationInner params={params} />
    </Suspense>
  )
}

async function ConfirmationInner({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <Confirmation orderId={id} />
}
