# VAULT 01: Decisions Log
*Append only. Newest at the bottom. Never delete; mark superseded instead.*

Format: `[YYYY-MM-DD] DECISION: ... | WHY: ... | ALTERNATIVES: ... | STATUS: active/superseded`

---

[2026-11-23] DECISION: Framework = Next.js (App Router) + TypeScript | WHY: one codebase for storefront, admin, and API; huge community; easy Vercel deploy | ALTERNATIVES: Laravel, Django, Shopify | STATUS: active

[2026-11-23] DECISION: Styling = Tailwind CSS | WHY: fast to build responsive UI | ALTERNATIVES: plain CSS, MUI | STATUS: active

[2026-11-23] DECISION: DB = SQLite (dev) via Prisma, PostgreSQL (prod) | WHY: zero setup locally, easy switch later | ALTERNATIVES: Supabase from day 1 | STATUS: active

[2026-11-23] DECISION: Payments = Razorpay | WHY: best fit for Indian customers (UPI, cards, netbanking) | ALTERNATIVES: Stripe, Cashfree | STATUS: active

[2026-11-23] DECISION: Prices stored as integer paise; totals always recomputed server-side | WHY: avoids float errors and client tampering | STATUS: active

[2026-11-23] DECISION: Guest checkout allowed | WHY: fewer abandoned carts | STATUS: active

[2026-11-23] DECISION: COD OFF at launch | WHY: user approved defaults; can enable later via paymentMethod toggle | ALTERNATIVES: COD on | STATUS: active

[2026-11-23] DECISION: Shipping = flat ₹99, free above ₹1,499 | WHY: simple MVP rule, implemented in lib/shipping.ts | ALTERNATIVES: pincode-based | STATUS: active

[2026-11-23] DECISION: GST included in listed prices (taxPaise = 0) | WHY: simplest checkout math | ALTERNATIVES: add GST at checkout | STATUS: active

[2026-11-23] DECISION: Images local/placeholder for now; Cloudinary when admin upload lands (M5) | WHY: no image pipeline needed for catalog MVP | ALTERNATIVES: Cloudinary from day 1 | STATUS: active

[2026-11-23] DECISION: Email provider = Resend (when reached in M6) | WHY: simple API, generous free tier | ALTERNATIVES: Brevo | STATUS: active

[2026-11-23] DECISION: Cart = dedicated /cart page (not drawer), persisted in localStorage, totals always from POST /api/cart/quote | WHY: simpler, server-verified prices | ALTERNATIVES: cart drawer | STATUS: active

[2026-11-23] DECISION: Prisma pinned to v6 (not v8 RC) | WHY: v8 is release-candidate with a new CLI workflow; v6 is stable and well-documented | STATUS: active

[2026-11-23] DECISION: App code lives in ./store subfolder; vault docs stay at project root | WHY: keeps planning docs separate from the Next.js app | STATUS: active

[2026-11-23] DECISION: Auth = custom session (scrypt password hash + HMAC-signed httpOnly cookie), NOT NextAuth | WHY: zero extra deps, sufficient for MVP credential auth; NextAuth can replace later if OAuth needed | ALTERNATIVES: NextAuth credentials | STATUS: active

[2026-11-23] DECISION: Razorpay via REST API (fetch), no SDK | WHY: avoids untyped SDK dependency; only 2 endpoints needed | ALTERNATIVES: razorpay npm SDK | STATUS: active

[2026-11-23] DECISION: Checkout payment methods = Razorpay only; COD radio shown but disabled | WHY: COD decided off at launch; UI keeps the slot for later | STATUS: active

[2026-11-23] DECISION: Guest checkout allowed; orders link to user account by userId when logged in, else by email | WHY: matches "guest checkout allowed" decision; account page shows orders matching either | STATUS: active

[2026-11-23] DECISION: Database switched SQLite → PostgreSQL on Neon (same DB for dev + prod) | WHY: Vercel serverless has read-only filesystem; SQLite file cannot persist. Neon free tier + pooler URL. Migrations re-run fresh; dev.db deleted | ALTERNATIVES: Turso, Supabase | STATUS: active

[2026-11-23] DECISION: Use Neon POOLED connection string for DATABASE_URL (no channel_binding param) | WHY: channel_binding=require broke Prisma auth; plain sslmode=require pooler URL verified working | STATUS: active

---

## Open questions (resolve and move up when decided)
- [x] COD at launch? → NO (2026-11-23)
- [x] Image hosting: Cloudinary vs S3? → local now, Cloudinary at M5
- [x] Shipping: flat rate vs pincode-based? → flat ₹99 / free above ₹1,499
- [x] Email provider: Resend vs Brevo? → Resend
