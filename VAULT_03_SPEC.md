# VAULT 03: Spec (Schema, Routes, Order Flow)
*Living reference. Update whenever schema or routes change.*

## Data model (Prisma, draft)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String            // hashed
  role      Role     @default(CUSTOMER)
  orders    Order[]
  createdAt DateTime @default(now())
}
enum Role { CUSTOMER ADMIN }

model Category {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  products Product[]
}

model Product {
  id          String         @id @default(cuid())
  name        String
  slug        String         @unique
  description String
  pricePaise  Int
  stock       Int            @default(0)
  active      Boolean        @default(true)
  categoryId  String?
  category    Category?      @relation(fields: [categoryId], references: [id])
  images      ProductImage[]
  createdAt   DateTime       @default(now())
}

model ProductImage {
  id        String  @id @default(cuid())
  url       String
  position  Int     @default(0)
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model Order {
  id             String      @id @default(cuid())
  userId         String?
  user           User?       @relation(fields: [userId], references: [id])
  email          String
  status         OrderStatus @default(PENDING)
  paymentMethod  String      // RAZORPAY | COD
  razorpayOrderId   String?  @unique
  razorpayPaymentId String?
  subtotalPaise  Int
  shippingPaise  Int
  taxPaise       Int
  totalPaise     Int
  shippingName   String
  shippingPhone  String
  shippingLine1  String
  shippingLine2  String?
  shippingCity   String
  shippingState  String
  shippingPin    String
  items          OrderItem[]
  createdAt      DateTime    @default(now())
}
enum OrderStatus { PENDING PAID SHIPPED DELIVERED CANCELLED REFUNDED }

model OrderItem {
  id         String  @id @default(cuid())
  orderId    String
  order      Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId  String
  name       String   // snapshot at purchase time
  pricePaise Int      // snapshot at purchase time
  quantity   Int
}
```

## Routes

**Storefront** — ✅ implemented in `store/app/`
- `/` home
- `/products` listing (`?q=&category=&sort=newest|price-asc|price-desc|name`)
- `/products/[slug]` detail
- `/cart`
- `/checkout` ✅ implemented (two-column layout per user spec: customer info + address + payment method | order summary with live qty steppers)
- `/order/[id]/confirmation` ✅ implemented
- `/account` ✅ implemented (profile + real order history)
- `/login`, `/signup` ✅ implemented
- `/policies/[slug]` (shipping, returns, privacy, terms) — pending M6

**Admin** (role = ADMIN)
- `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/orders`, `/admin/orders/[id]`

**API**
- `POST /api/cart/quote` ✅ implemented: validates cart (IDs + integer qty 1–99), recomputes prices/stock server-side, returns lines + subtotal/shipping/tax/total + per-item errors
- `POST /api/checkout/create-order` ✅ implemented: validates customer/address fields, recomputes totals via `lib/pricing.ts`, creates PENDING order + Razorpay order, returns checkout params (503 if Razorpay keys missing)
- `POST /api/checkout/verify` ✅ implemented: HMAC signature check, idempotent (PAID → ok), marks PAID + decrements stock in transaction
- `POST /api/webhooks/razorpay`: backup confirmation, idempotent — pending
- `POST /api/auth/*`: not used — auth is cookie-session via server actions (`app/actions/auth.ts`), not NextAuth
- `POST /api/admin/upload`: image upload — pending M5

## Order flow
1. Client sends cart (product IDs + quantities only, never prices).
2. Server loads current prices and stock, computes subtotal, shipping, tax, total (`computeCartQuote` in `lib/pricing.ts`, shared by `/api/cart/quote` and `/api/checkout/create-order`).
3. Create `Order` as PENDING, create Razorpay order for `totalPaise`.
4. Client opens Razorpay checkout (`lib/razorpay-client.ts` loads checkout.js on demand).
5. On success, client posts payment details to `/verify`. Server checks HMAC signature, sets PAID, reduces stock in a transaction.
6. Webhook handles the case where the user closes the tab after paying (must be idempotent) — TODO.
7. Admin moves PAID → SHIPPED → DELIVERED.

## Env vars (`.env.example`)
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
EMAIL_API_KEY=
EMAIL_FROM=
CLOUDINARY_URL=
```

## Business rules (fill from VAULT_00)
- Shipping: flat ₹99 (9,900 paise), free when subtotal ≥ ₹1,499 (149,900 paise) — `store/lib/shipping.ts`
- Tax: GST included in price; `taxPaise = 0`
- Low-stock threshold: ≤5 shows "Only N left" warning (UI-level, not enforced)
