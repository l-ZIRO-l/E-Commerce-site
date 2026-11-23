'use client'

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

export interface CartLine {
  productId: string
  quantity: number
}

interface CartContextValue {
  items: CartLine[]
  hydrated: boolean
  count: number
  addItem: (productId: string, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'cart'
const EMPTY: CartLine[] = []

// External store backed by localStorage (client-only).
let cartItems: CartLine[] = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (typeof window === 'undefined' || loaded) return
  loaded = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        cartItems = parsed.filter(
          (l): l is CartLine =>
            typeof l?.productId === 'string' &&
            Number.isInteger(l?.quantity) &&
            l.quantity > 0,
        )
      }
    }
  } catch {
    cartItems = EMPTY
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function commit(next: CartLine[]) {
  cartItems = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage full or unavailable — cart still works in memory
  }
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  load()
  return () => listeners.delete(listener)
}

function getSnapshot(): CartLine[] {
  load()
  return cartItems
}

function getServerSnapshot(): CartLine[] {
  return EMPTY
}

function useHydrated() {
  return useSyncExternalStore(
    (cb) => {
      // hydration flag never changes after mount; subscribe is a no-op
      cb()
      return () => {}
    },
    () => true,
    () => false,
  )
}

function addItem(productId: string, quantity = 1) {
  const existing = cartItems.find((l) => l.productId === productId)
  if (existing) {
    commit(
      cartItems.map((l) =>
        l.productId === productId
          ? { ...l, quantity: Math.min(l.quantity + quantity, 99) }
          : l,
      ),
    )
  } else {
    commit([...cartItems, { productId, quantity: Math.min(quantity, 99) }])
  }
}

function setQuantity(productId: string, quantity: number) {
  commit(
    quantity <= 0
      ? cartItems.filter((l) => l.productId !== productId)
      : cartItems.map((l) =>
          l.productId === productId
            ? { ...l, quantity: Math.min(quantity, 99) }
            : l,
        ),
  )
}

function removeItem(productId: string) {
  commit(cartItems.filter((l) => l.productId !== productId))
}

function clear() {
  commit([])
}

const api = { addItem, setQuantity, removeItem, clear }

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const hydrated = useHydrated()
  const count = useMemo(
    () => items.reduce((sum, l) => sum + l.quantity, 0),
    [items],
  )

  const value = useMemo<CartContextValue>(
    () => ({ items, hydrated, count, ...api }),
    [items, hydrated, count],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
