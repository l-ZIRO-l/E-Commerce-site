import Link from 'next/link'
import { Suspense } from 'react'
import { getCategories, getProducts } from '@/lib/catalog'
import { ProductCard } from '@/components/product-card'

const sorts = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
]

async function Listing({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q : undefined
  const category = typeof sp.category === 'string' ? sp.category : undefined
  const sort = typeof sp.sort === 'string' ? sp.sort : undefined

  const [products, categories] = await Promise.all([
    getProducts({ q, category, sort }),
    getCategories(),
  ])

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <form
          action="/products"
          method="get"
          className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4"
        >
          <div>
            <label htmlFor="q" className="mb-1 block text-sm font-medium">
              Search
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q ?? ''}
              placeholder="Product name…"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue={category ?? ''}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort" className="mb-1 block text-sm font-medium">
              Sort by
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={sort ?? 'newest'}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              {sorts.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Apply
          </button>
          {(q || category || sort) && (
            <Link
              href="/products"
              className="text-center text-sm text-zinc-500 underline"
            >
              Clear filters
            </Link>
          )}
        </form>
      </aside>

      <section className="flex-1">
        <p className="mb-4 text-sm text-zinc-500">
          {products.length} product{products.length === 1 ? '' : 's'}
          {q ? ` matching “${q}”` : ''}
        </p>
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-zinc-500">
            No products found. Try a different search or category.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
        )}
      </section>
    </div>
  )
}

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">All products</h1>
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-lg bg-zinc-100"
              />
            ))}
          </div>
        }
      >
        <Listing searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
