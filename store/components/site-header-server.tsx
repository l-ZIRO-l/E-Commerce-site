import { Suspense } from 'react'
import { getSessionUser } from '@/lib/auth'
import { SiteHeader, type HeaderUser } from './site-header'

async function HeaderWithUser() {
  const user = await getSessionUser()
  const headerUser: HeaderUser | null = user
    ? { name: user.name, email: user.email }
    : null
  return <SiteHeader user={headerUser} />
}

export function SiteHeaderServer() {
  return (
    <Suspense fallback={<SiteHeader />}>
      <HeaderWithUser />
    </Suspense>
  )
}
