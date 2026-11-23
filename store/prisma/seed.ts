import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Books', slug: 'books' },
]

// Prices in paise (INR * 100). imageKeyword kept for future relevant-image APIs.
const products = [
  { name: 'Wireless Earbuds', slug: 'wireless-earbuds', description: 'Bluetooth 5.3 earbuds with active noise cancellation, 30h battery life, and USB-C charging case.', pricePaise: 249900, stock: 25, category: 'electronics', imageKeyword: 'headphones' },
  { name: 'Smart Watch', slug: 'smart-watch', description: 'Fitness tracker with heart-rate monitor, sleep tracking, and 10-day battery.', pricePaise: 399900, stock: 18, category: 'electronics', imageKeyword: 'smartwatch' },
  { name: 'Mechanical Keyboard', slug: 'mechanical-keyboard', description: 'Hot-swappable 75% keyboard with tactile switches and RGB backlight.', pricePaise: 549900, stock: 12, category: 'electronics', imageKeyword: 'keyboard' },
  { name: 'Ceramic Pour-Over Set', slug: 'ceramic-pour-over-set', description: 'Handmade stoneware dripper and carafe, dishwasher safe.', pricePaise: 189900, stock: 30, category: 'home-kitchen', imageKeyword: 'coffee' },
  { name: 'Cast Iron Skillet', slug: 'cast-iron-skillet', description: 'Pre-seasoned 10-inch skillet. Excellent heat retention for searing.', pricePaise: 279900, stock: 15, category: 'home-kitchen', imageKeyword: 'skillet' },
  { name: 'Bamboo Cutting Board', slug: 'bamboo-cutting-board', description: 'Large organic bamboo board with juice groove. Gentle on knife blades.', pricePaise: 89900, stock: 40, category: 'home-kitchen', imageKeyword: 'cuttingboard' },
  { name: 'Organic Cotton Tee', slug: 'organic-cotton-tee', description: 'Heavyweight 220gsm organic cotton crew-neck tee. Unisex fit.', pricePaise: 99900, stock: 60, category: 'fashion', imageKeyword: 'tshirt' },
  { name: 'Linen Shirt', slug: 'linen-shirt', description: 'Relaxed-fit European flax linen shirt. Breathable for warm weather.', pricePaise: 149900, stock: 22, category: 'fashion', imageKeyword: 'linen shirt' },
  { name: 'Minimalist Backpack', slug: 'minimalist-backpack', description: '20L weatherproof backpack with padded 16" laptop sleeve.', pricePaise: 329900, stock: 14, category: 'fashion', imageKeyword: 'backpack' },
  { name: 'Atomic Habits (Paperback)', slug: 'atomic-habits-paperback', description: 'James Clear\'s bestselling guide to building good habits and breaking bad ones.', pricePaise: 39900, stock: 50, category: 'books', imageKeyword: 'book' },
]

function imageUrl(_keyword: string, slug: string): string {
  // LoremFlickr is unreliable; picsum gives stable random photos per seed, no API key.
  return `https://picsum.photos/seed/${slug}/800/800`
}

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
  }

  const catMap = new Map((await prisma.category.findMany()).map((c) => [c.slug, c.id]))

  for (const p of products) {
    const { category, imageKeyword, ...data } = p
    const categoryId = catMap.get(category) ?? null
    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: { ...data, categoryId },
      create: { ...data, categoryId },
    })

    // Replace images so reseeding stays idempotent
    await prisma.productImage.deleteMany({ where: { productId: product.id } })
    await prisma.productImage.create({
      data: {
        url: imageUrl(imageKeyword, data.slug),
        position: 0,
        productId: product.id,
      },
    })
  }

  console.log('Seeded', products.length, 'products and', categories.length, 'categories')
}

main().finally(() => prisma.$disconnect())
