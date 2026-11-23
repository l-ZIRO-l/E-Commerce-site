import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getProductBySlug } from '@/lib/catalog'
import { formatINR } from '@/lib/format'
import { AddToCartButton } from '@/components/add-to-cart-button'

async function ProductDetail({ slug }: { slug: string }) {
  const product = await getProductBySlug(slug)
  if (!product || !product.active) notFound()

  const imageUrl = product.images[0]?.url
  const outOfStock = product.stock <= 0

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex aspect-square items-center justify-center rounded-lg bg-zinc-100 text-8xl font-bold text-zinc-300">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={product.name} className="h-full w-full rounded-lg object-cover" />
        ) : (
          product.name.charAt(0).toUpperCase()
        )}
      </div>

      <div className="flex flex-col gap-4">
        {product.category && (
          <Link
            href={`/products?category=${product.category.slug}`}
            className="text-sm uppercase tracking-wide text-zinc-500 hover:text-zinc-900"
          >
            {product.category.name}
          </Link>
        )}
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-2xl font-semibold">{formatINR(product.pricePaise)}</p>
        <p className="whitespace-pre-line text-zinc-600">
          {product.description}
        </p>
        <p className="text-sm text-zinc-500">
          {outOfStock
            ? 'Out of stock'
            : product.stock <= 5
              ? `Only ${product.stock} left in stock`
              : 'In stock'}
        </p>
        <AddToCartButton productId={product.id} disabled={outOfStock} />
        <Link href="/products" className="text-sm text-zinc-500 underline">
          ← Back to all products
        </Link>
      </div>
    </div>
  )
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-lg bg-zinc-100" />
          <div className="flex flex-col gap-4">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-100" />
            <div className="h-6 w-24 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
      }
    >
      <ProductDetailInner params={params} />
    </Suspense>
  )
}

async function ProductDetailInner({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ProductDetail slug={slug} />
}
