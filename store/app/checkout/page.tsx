import { Suspense } from 'react'
import { getSessionUser } from '@/lib/auth'
import { CheckoutClient } from '@/components/checkout-client'

async function CheckoutLoader() {
  const user = await getSessionUser()
  return (
    <CheckoutClient
      user={user ? { name: user.name, email: user.email } : null}
    />
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[480px] animate-pulse rounded-2xl bg-zinc-100" />
      }
    >
      <CheckoutLoader />
    </Suspense>
  )
}
