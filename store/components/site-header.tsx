'use client'

import Link from 'next/link'
import { useCart } from './cart-context'

export interface HeaderUser {
  name: string | null
  email: string
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M6 7h12l1.2 12.2a1 1 0 0 1-1 1.1H5.8a1 1 0 0 1-1-1.1L6 7Z"
        strokeLinejoin="round"
      />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" strokeLinecap="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" strokeLinecap="round" />
    </svg>
  )
}

export function SiteHeader({ user = null }: { user?: HeaderUser | null }) {
  const { count, hydrated } = useCart()

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          The Store
        </Link>

        <nav className="hidden items-center gap-6 text-sm sm:flex">
          <Link href="/" className="font-medium text-zinc-900">
            Home
          </Link>
          <Link href="/products" className="text-zinc-600 hover:text-zinc-900">
            Products
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/products"
            aria-label="Search products"
            className="rounded-full p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <SearchIcon />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <BagIcon />
            {hydrated && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-xs font-medium text-white">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <Link
              href="/account"
              aria-label="Account"
              className="flex items-center gap-2 rounded-full border border-zinc-300 py-1.5 pl-2 pr-3 text-sm font-medium hover:bg-zinc-50"
            >
              <UserIcon />
              <span className="hidden max-w-24 truncate sm:inline">
                {user.name ?? user.email}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
