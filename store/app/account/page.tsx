import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { logoutAction } from '@/app/actions/auth'
import { formatINR } from '@/lib/format'

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  SHIPPED: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-zinc-200 text-zinc-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-purple-100 text-purple-800',
}

async function AccountContent() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const orders = await prisma.order.findMany({
    where: { OR: [{ userId: user.id }, { email: user.email }] },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">My account</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {user.name} · {user.email}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Log out
          </button>
        </form>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Order history</h2>
        {orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
            No orders yet.{' '}
            <Link href="/products" className="underline">
              Start shopping
            </Link>
            .
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((o) => (
              <li
                key={o.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/order/${o.id}/confirmation`}
                    className="font-medium hover:underline"
                  >
                    Order {o.id.slice(-8).toUpperCase()}
                  </Link>
                  <p className="text-sm text-zinc-500">
                    {o.items.reduce((s, i) => s + i.quantity, 0)} item
                    {o.items.reduce((s, i) => s + i.quantity, 0) === 1
                      ? ''
                      : 's'}{' '}
                    · {formatINR(o.totalPaise)} ·{' '}
                    {new Date(o.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${statusStyles[o.status] ?? 'bg-zinc-100'}`}
                >
                  {o.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={<div className="h-64 animate-pulse rounded-lg bg-zinc-100" />}
    >
      <AccountContent />
    </Suspense>
  )
}
