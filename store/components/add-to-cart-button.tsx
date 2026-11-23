'use client'

import { useState } from 'react'
import { useCart } from './cart-context'

export function AddToCartButton({
  productId,
  disabled,
}: {
  productId: string
  disabled?: boolean
}) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        addItem(productId, 1)
        setAdded(true)
        setTimeout(() => setAdded(false), 1500)
      }}
      className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 sm:w-auto sm:px-8"
    >
      {disabled ? 'Out of stock' : added ? 'Added to cart ✓' : 'Add to cart'}
    </button>
  )
}
