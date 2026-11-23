import Link from 'next/link'
import { formatINR } from '@/lib/format'

interface ProductCardProps {
  name: string
  slug: string
  pricePaise: number
  categoryName?: string | null
  stock: number
  imageUrl?: string | null
}

export function ProductCard({
  name,
  slug,
  pricePaise,
  categoryName,
  stock,
  imageUrl,
}: ProductCardProps) {
  const outOfStock = stock <= 0

  return (
    <Link
      href={`/products/${slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl font-bold text-zinc-300">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {categoryName && (
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            {categoryName}
          </span>
        )}
        <h3 className="text-sm font-medium leading-snug text-zinc-900 group-hover:underline">
          {name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold">{formatINR(pricePaise)}</span>
          {outOfStock ? (
            <span className="text-xs text-red-600">Out of stock</span>
          ) : stock <= 5 ? (
            <span className="text-xs text-amber-600">Only {stock} left</span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
