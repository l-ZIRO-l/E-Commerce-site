# E-Commerce Site

A simple online store built with **Next.js** — customers can browse products, add them to a cart, check out, and pay online. An admin area for managing products and orders comes later.

> **Total beginner?** Read top to bottom once. Each section builds on the last.

---

## 1. What this project is

Think of it like a small shop with a website:

- **Storefront** — the pages customers see: home page, product list, product details, cart, checkout.
- **Backend** — invisible code that checks prices, saves orders, and talks to the payment company (Razorpay).
- **Database** — a file (`store/prisma/dev.db`) that remembers products, users, and orders. We use **SQLite**: a real database that lives in a single file, so nothing extra needs to be installed.

### The customer journey (what we built so far)

```
Home page → Products page → Product page → Add to cart → Cart page
→ Checkout page (address + payment) → Pay → Confirmation page → Order saved
```

Every step after "Add to cart" works end to end, including a **fake payment mode** so you can test purchases without any API keys (see §6).

---

## 2. Tech stack (what everything is made of)

| Piece | Technology | Why |
|---|---|---|
| Framework | **Next.js 16** (React) | One codebase for pages + API. Very popular, easy to deploy free. |
| Language | **TypeScript** | Catches bugs before the site runs. |
| Styling | **Tailwind CSS** | Styles written as small classes directly in the code. |
| Database | **SQLite + Prisma** | Prisma is a tool that lets us describe tables in `prisma/schema.prisma` and gives us ready-made functions to read/write data. |
| Auth | Custom (built ourselves) | Passwords hashed with `scrypt`, login kept in a signed cookie. No external service needed. |
| Payments | **Razorpay** | Indian payment company — UPI, cards, netbanking. |
| Images | **Picsum.photos** | Free placeholder photos, no API key needed. |

---

## 3. Folder map

```
E Commerce Site/
├── MASTER_PROMPT.md      ← Instructions for the AI assistant working on this project
├── VAULT_00_BRIEF.md     ← Store details (name, products, rules) — FILL THIS IN
├── VAULT_01_DECISIONS.md ← Log of every technical decision made
├── VAULT_02_PROGRESS.md  ← Checklist of what's done / what's next (M0–M7)
├── VAULT_03_SPEC.md      ← Database schema + page/API map
├── VAULT_04_SESSION_LOG.md ← Diary of what happened each working session
└── store/                ← THE ACTUAL WEBSITE CODE
    ├── app/              ← Pages and API routes (Next.js App Router)
    │   ├── page.tsx              Home page
    │   ├── products/             Listing + [slug] product detail
    │   ├── cart/                 Cart page
    │   ├── checkout/             Checkout page
    │   ├── order/[id]/confirmation/  Order confirmation
    │   ├── login/  signup/  account/  Auth pages
    │   ├── api/                  Backend endpoints (cart quote, checkout, verify)
    │   └── actions/auth.ts       Signup/login/logout logic
    ├── components/       ← Reusable UI pieces (header, product card, cart context, checkout form)
    ├── lib/              ← Shared logic: db.ts, auth.ts, pricing.ts, shipping.ts, razorpay.ts
    ├── prisma/
    │   ├── schema.prisma ← THE database blueprint (all tables)
    │   ├── seed.ts       ← Script that fills the DB with 10 sample products
    │   ├── dev.db        ← The actual SQLite database file
    │   └── migrations/   ← History of DB changes
    ├── .env              ← YOUR secrets (gitignored — never commit this)
    ├── .env.example      ← Template showing which keys are needed
    └── package.json      ← Project settings + npm commands
```

**Key files to know:**

- `store/prisma/schema.prisma` — every table: `User`, `Category`, `Product`, `ProductImage`, `Order`, `OrderItem`
- `store/lib/pricing.ts` — the money brain. Always recomputes cart totals on the server so customers can't fake prices.
- `store/lib/shipping.ts` — business rules: ₹99 shipping, free above ₹1,499.
- `store/.env` — where API keys go.

---

## 4. How to run the project (do this every time)

You need **Node.js 20+** installed (check with `node -v`).

```powershell
# 1. Go into the app folder
cd "D:\PROJECTS\E Commerce Site\store"

# 2. Install dependencies (only needed once, or after package.json changes)
npm install

# 3. Set up the database (only needed once)
npx prisma migrate dev     # creates dev.db from schema.prisma
npm run db:seed            # adds 10 sample products + 4 categories

# 4. Start the dev server
npm run dev
```

Then open **http://localhost:3000** in your browser.

> If port 3000 is busy, Next.js automatically uses 3001 — check the terminal output for the actual URL.

### Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the site with live-reload (use this daily) |
| `npm run lint` | Check code for errors/style issues |
| `npm run build` | Production build — run before deploying |
| `npm run db:seed` | Re-fill the database with sample products |
| `npm run db:studio` | Opens a visual database browser at localhost:5555 |

---

## 5. How the important parts work

### Cart
- Stored in the browser's `localStorage` (survives refresh, no account needed).
- The browser only sends **product IDs + quantities** — never prices.
- `POST /api/cart/quote` asks the server "what should this cart cost?" and the server looks up real prices/stock. This is why customers can't cheat by editing prices.

### Checkout & orders
- `POST /api/checkout/create-order` validates the address form, recomputes totals, saves an `Order` with status `PENDING`, and asks Razorpay for a payment order.
- Razorpay's popup collects the money. On success, `POST /api/checkout/verify` checks a cryptographic **signature** (proof the payment is real) and marks the order `PAID`, then reduces stock.
- Money is always stored as **integer paise** (₹249.90 = 24990). Never decimals — avoids rounding bugs.

### Auth
- Signup/login are **server actions** (`app/actions/auth.ts`) — plain forms, no JavaScript framework needed.
- Passwords are hashed with `scrypt` (one-way — even we can't read them).
- Login creates a signed, httpOnly cookie valid for 30 days.
- Guest checkout works; orders link to your account by email if you log in.

### The vault files
The `VAULT_*.md` files are the project's memory:
- **VAULT_00** — your store's real details (still placeholders — fill in!)
- **VAULT_01** — every decision + why (append-only log)
- **VAULT_02** — milestone checklist M0–M7; currently finished through M4
- **VAULT_03** — schema/routes reference
- **VAULT_04** — session diary

---

## 6. Testing a purchase WITHOUT Razorpay keys

Real payments need Razorpay keys, but for development we added a safe fake mode:

`.env` contains `DEV_FAKE_PAY=1`. With it, clicking **Pay** instantly marks the order PAID — the whole flow works with zero API keys. It **cannot** work in production (`NODE_ENV=production` disables it).

**To use real Razorpay later:**
1. Sign up free at dashboard.razorpay.com
2. Settings → API Keys → generate **Test** keys
3. Paste into `store/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```
4. Remove or set `DEV_FAKE_PAY=` (empty) to use real payments.
5. Test card: `4111 1111 1111 1111`, any future expiry, any CVV.

---

## 7. Git workflow (how we save & share code)

```powershell
cd "D:\PROJECTS\E Commerce Site"

# See what changed
git status

# Save a snapshot ("commit")
git add -A
git commit -m "describe what you changed"

# Upload to GitHub
git push
```

- `.env` is **never committed** (it has secrets). `.env.example` shows what's needed.
- Remote: `https://github.com/l-ZIRO-l/E-Commerce-site`, branch `main`.

---

## 8. Project status & what's next

| Milestone | Status |
|---|---|
| M0 Setup | ✅ Done |
| M1 Catalog (products, search, detail) | ✅ Done |
| M2 Cart | ✅ Done |
| M3 Auth (signup/login/account) | ✅ Done |
| M4 Checkout & payments | ✅ Done (webhook pending) |
| M5 Admin panel | ⬜ Next — manage products/orders |
| M6 Emails, SEO, policy pages | ⬜ |
| M7 Launch (Postgres, Vercel, live keys) | ⬜ |

**Immediate next step:** fill in `VAULT_00_BRIEF.md` with your real store name, products, shipping and returns info — everything else is built around placeholders.

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `Port 3000 is in use` | Another dev server is running — use the URL it prints (3001), or close the old terminal. |
| `npm run lint` says "no package.json" | You're in the wrong folder — `cd store` first. |
| Page shows "could not calculate totals" | Restart `npm run dev` after editing `.env`. |
| Database looks empty | Run `npm run db:seed`. |
| Pay button says "payments not configured" | Expected without Razorpay keys — or set `DEV_FAKE_PAY=1`. |
| Prisma errors | Run `npx prisma migrate dev` to sync `dev.db` with `schema.prisma`. |

---

## 10. Glossary (words you'll see)

- **Paise** — ₹1 = 100 paise. We store money as integers (249900 = ₹2,499) to avoid decimal bugs.
- **SKU / slug** — a URL-safe product ID, e.g. `wireless-earbuds`.
- **PENDING / PAID / SHIPPED** — order statuses in the database.
- **Server vs Client component** — files without `'use client'` run on the server (can touch the DB); files with it run in the browser (can use localStorage, buttons).
- **Suspense** — shows a loading skeleton while data loads (required by our Next.js config).
- **Webhook** — Razorpay calling *our* server to confirm a payment even if the customer closed the tab. (TODO in M4.)

---

*Built with Devin. Decisions and history live in the `VAULT_*.md` files — read VAULT_04 first if you're ever confused about why something is the way it is.*
