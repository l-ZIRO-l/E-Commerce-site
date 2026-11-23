import Link from 'next/link'
import { Suspense } from 'react'
import { getCategories, getFeaturedProducts } from '@/lib/catalog'
import { ProductCard } from '@/components/product-card'

async function FeaturedProducts() {
  const products = await getFeaturedProducts(8)
  if (products.length === 0) {
    return (
      <p className="text-zinc-500">
        No products yet. Run <code>npm run db:seed</code> to add samples.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          name={p.name}
          slug={p.slug}
          pricePaise={p.pricePaise}
          categoryName={p.category?.name}
          stock={p.stock}
          imageUrl={p.images[0]?.url}
        />
      ))}
    </div>
  )
}

async function CategoryChips() {
  const categories = await getCategories()
  if (categories.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/products?category=${c.slug}`}
          className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:border-zinc-900 hover:text-zinc-900"
        >
          {c.name}
        </Link>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-xl bg-zinc-900 px-6 py-16 text-white sm:px-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Quality goods, honestly priced.
        </h1>
        <p className="mt-3 max-w-xl text-zinc-300">
          Browse the catalog, add what you love to your cart, and check out in
          minutes.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-md bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          Shop all products
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Featured</h2>
          <Link href="/products" className="text-sm text-zinc-600 underline">
            View all
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-lg bg-zinc-100"
                />
              ))}
            </div>
          }
        >
          <FeaturedProducts />
        </Suspense>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Categories</h2>
        <Suspense fallback={<div className="h-9 animate-pulse rounded bg-zinc-100" />}>
          <CategoryChips />
        </Suspense>
      </section>
    </div>
  )
}
