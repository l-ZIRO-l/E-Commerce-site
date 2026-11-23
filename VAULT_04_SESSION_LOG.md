# VAULT 04: Session Log
*Newest entry at the top. One entry per working session.*

Template:
```
## [YYYY-MM-DD] Session N
**Goal:**
**Done:**
**Files touched:**
**Problems / fixes:**
**Open questions:**
**Next session starts with:**
```

---

## [2026-11-23] Session 2
**Goal:** Take the store through purchase — auth/profile, checkout page (user's design), order creation, Razorpay payment + verification, confirmation.
**Done:**
- Auth: scrypt password hashing + HMAC-signed httpOnly session cookie (`lib/auth.ts`); server actions signup/login/logout (`app/actions/auth.ts`); `/login`, `/signup`, `/account` (profile + real order history)
- Header rebuilt: search icon, bag icon with count badge, Sign-in pill / account chip top-right
- Checkout `/checkout` per user's design: breadcrumb, two-step tabs, customer info + delivery address + payment method (Razorpay selected, COD disabled), "Current Order" summary card with live qty steppers synced to cart
- `POST /api/checkout/create-order`: full server-side validation (email, phone, address, 6-digit PIN), recomputes totals, creates PENDING order + Razorpay order via REST
- `POST /api/checkout/verify`: HMAC signature verification, idempotent, marks PAID + decrements stock in transaction
- `/order/[id]/confirmation`: order summary, status badge, delivery address
- `/cart` now links to `/checkout` when cart is valid
- Shared pricing logic extracted to `lib/pricing.ts` (`computeCartQuote`)
- **Fake-pay dev mode** (`DEV_FAKE_PAY=1` in `.env`, never in production): `/api/checkout/verify-fake` marks orders PAID without Razorpay — full purchase flow testable with zero API keys. Verified end-to-end: order → PAID → stock decremented (25→24) → confirmation page
- Product images: all 10 seeds got Picsum photo URLs (no API key); cards, detail, cart, checkout thumbnails render them
- Verified: lint clean, build passes, all routes 200; create-order validates PIN, creates PENDING order, returns 503 until Razorpay keys added; verify rejects bad signatures
**Files touched:** `store/` — lib/{auth,pricing,razorpay,razorpay-client}.ts, app/{login,signup,account,checkout,order/[id]/confirmation,actions/auth}, components/{checkout-client,site-header,site-header-server}, api routes
**Problems / fixes:** none blocking — actual payment untested until Razorpay test keys are added to `.env`
**Open questions:** Razorpay test keys needed for real purchase test; webhook still TODO; returns policy/contact TBD in VAULT_00
**Next session starts with:** add Razorpay test keys → full purchase test → M5 admin.

### Session 2 addendum — Vercel deploy fix
- **Problem:** deployed site 500'd — SQLite `dev.db` can't persist on Vercel's read-only serverless filesystem
- **Fix:** switched to Neon Postgres (user provided connection string). `schema.prisma` provider → postgresql + `binaryTargets` incl. rhel-openssl-3.0.x; fresh `init` migration applied; reseeded 10 products; dev.db + old sqlite migration deleted
- **Gotcha:** pooler URL with `channel_binding=require` fails Prisma auth (P1000) — using pooler URL with plain `sslmode=require` works for both migrations and runtime
- **Verified:** all pages 200 locally against Neon
- **Remaining for live site:** set `DATABASE_URL` + `AUTH_SECRET` in Vercel project env vars, redeploy

## [2026-11-23] Session 1
**Goal:** Build M0–M2 (setup, catalog, cart).
**Done:**
- Scaffolded Next.js 16 + TS + Tailwind app in `store/` (Cache Components + Partial Prefetching enabled)
- Prisma 6 + SQLite: full schema from VAULT_03 migrated, 10 products / 4 categories seeded
- Storefront: home, `/products` (search/category/sort via GET form), `/products/[slug]`
- Cart: localStorage-backed context (`components/cart-context.tsx` using `useSyncExternalStore`), `/cart` page, `POST /api/cart/quote` for server-verified totals
- Business rules coded: ₹99 flat shipping, free above ₹1,499, GST included (`lib/shipping.ts`)
- Verified: `next lint` clean, `next build` passes, all pages 200, quote API returns correct totals and rejects bad/oversold items
**Files touched:** `store/` (whole app), VAULT_00–04
**Problems / fixes:**
- Prisma 8 RC installed by default → pinned to v6 stable
- Cache Components rejects `new Date()` in prerender → simplified footer
- React hooks lint rejects setState-in-effect → cart store rewritten with `useSyncExternalStore`
**Open questions:** real store name/products (VAULT_00 placeholders); returns policy; support contact
**Next session starts with:** M3 Auth — decide NextAuth vs lightweight credentials auth, then build signup/login/logout.

## [2026-11-23] Session 0
**Goal:** Create master prompt and memory vault.
**Done:** Vault files created; default stack and MVP scope chosen.
**Files touched:** all VAULT_* files, MASTER_PROMPT.md
**Problems / fixes:** none
**Open questions:** see VAULT_01 open questions
**Next session starts with:** Fill VAULT_00_BRIEF.md, then begin M0 setup.
