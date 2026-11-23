# VAULT 02: Progress Tracker
*Update at the end of every session. Tick boxes only when verified working.*

**Current milestone:** M5 (Admin)
**Last updated:** 2026-11-23

## M0: Setup
- [x] Fill in VAULT_00_BRIEF.md (placeholder values — replace with real store info)
- [x] Install Node 20+, Git, VS Code (Node v22.18.0, Git 2.55 confirmed)
- [x] Create Next.js + TS + Tailwind project (`store/`, Next.js 16.4.6, Tailwind 4)
- [x] Git repo initialized, `.env.example` created
- [x] Prisma + SQLite connected (Prisma 6.19.3, `prisma/dev.db`, migration `init` applied)

## M1: Catalog
- [x] Prisma schema: Product, Category, ProductImage (+ User, Order, OrderItem per VAULT_03)
- [x] Seed script with 10 sample products (`npm run db:seed`)
- [x] Home page (`/` — hero, featured products, category chips)
- [x] Product listing (search, category filter, sort) (`/products?q=&category=&sort=`)
- [x] Product detail page (`/products/[slug]`)

## M2: Cart
- [x] Cart state (persisted in localStorage via `components/cart-context.tsx`)
- [x] Add/remove/update quantity (AddToCartButton, /cart controls)
- [x] Cart page with server-verified totals (`POST /api/cart/quote`; prices never trusted from client)

## M3: Auth
- [x] Sign up / log in / log out (`/signup`, `/login`, `/account`; custom scrypt + signed cookie — see VAULT_01)
- [x] Password hashing, session handling (`lib/auth.ts`, 30-day httpOnly cookie)
- [x] Account page with order history (real orders, not stub; matches by userId or email)

## M4: Checkout and payments
- [x] Address form + validation (name, email, phone, address, 6-digit PIN — validated server-side)
- [x] Shipping and tax calculation (`lib/pricing.ts` + `lib/shipping.ts`, recomputed server-side)
- [x] Create order (status PENDING) — `POST /api/checkout/create-order`
- [x] Razorpay order creation (REST API; needs `RAZORPAY_KEY_ID`/`SECRET` in `.env`)
- [x] Razorpay signature verification (`POST /api/checkout/verify`, HMAC + timingSafeEqual, stock decrement in transaction)
- [ ] Razorpay webhook (`/api/webhooks/razorpay` — backup for closed-tab payments, idempotent)
- [x] Order confirmation page (`/order/[id]/confirmation`)
- [x] COD option — DECIDED: off at launch (UI shows disabled radio)
- [x] Handle payment failure and retry (dismiss resets button; retry creates a fresh order; dev fake-pay mode `DEV_FAKE_PAY=1` allows full flow without Razorpay keys)

## M5: Admin
- [ ] Admin login (role-based)
- [ ] Product CRUD + image upload
- [ ] Order list + status update
- [ ] Basic stock management

## M6: Emails and polish
- [ ] Order confirmation email (Resend)
- [ ] Admin new-order notification
- [ ] SEO: titles, meta, sitemap, OG images
- [ ] Policy pages (shipping, returns, privacy, terms, contact)
- [ ] Mobile and accessibility pass
- [ ] Error pages (404/500), loading states

## M7: Launch
- [ ] Switch to PostgreSQL, run migrations
- [ ] Deploy to Vercel, set env vars
- [ ] Razorpay live keys + webhook URL
- [ ] Custom domain + HTTPS
- [ ] Test purchase with real small payment
- [ ] Backups enabled

## Blockers
- none yet

## Next 3 actions
1. Add Razorpay TEST keys to `store/.env` and run a real test purchase end-to-end
2. M4 leftover: Razorpay webhook for closed-tab payments
3. M5: Admin — login (role-based), product CRUD + image upload, order status updates
