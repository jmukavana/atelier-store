# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Atelier is a fictional e-commerce storefront split into two independent
services in this one repo:

- **`/` (this directory)** — the Next.js App Router frontend (TypeScript,
  Tailwind CSS v4, shadcn/ui). Pure presentation layer: no database access,
  no ORM. Everything it knows about products and orders comes from HTTP
  calls to the backend.
- **`backend/`** — a FastAPI service (Python, `uv`-managed, SQLAlchemy 2.0
  async + Alembic + Postgres) that owns the product catalog, orders, and
  newsletter signups. This is the actual source of truth; see
  `backend/CLAUDE.md` (if present) or the section below for its internals.

There is no real shipping/fulfillment — checkout is a labeled demo — but
almost everything around it is real: email/password auth with server-side
sessions (see "Authentication"), a real Stripe test-mode Checkout Session
integration with a no-Stripe-configured fallback (see "Payments"), a
per-account wishlist, product search/sort, and an order-tracking timeline
that's honest about what this demo does and doesn't track (see "Product
discovery, wishlist, and order tracking").

## Running everything: Docker Compose (recommended)

```
docker compose up --build   # first run / after dependency or Dockerfile changes
docker compose up -d        # subsequent runs
docker compose down         # stop (keeps the `atelier_pgdata` volume — data survives)
docker compose down -v      # stop AND wipe the database volume
docker compose logs -f backend   # any service: backend | frontend | db
```

Brings up all three services — `db` (Postgres 16, its own container, isolated
from any Postgres already on the host), `backend`, `frontend` — in the right
order via healthchecks (`db` healthy → `backend` starts → `backend` healthy →
`frontend` starts). The backend's entrypoint (`backend/docker-entrypoint.sh`)
runs `alembic upgrade head` then the (idempotent) seed script on every
container start, so a fresh `docker compose up` needs no manual migrate/seed
step. Frontend: `http://localhost:3000`. Backend + `/docs`:
`http://localhost:8000`.

**The two-`API_URL` split is the one non-obvious thing here** — see
`src/lib/api-url.ts`. The browser and the frontend *container* need different
addresses for the backend: the browser can only reach the published port
(`NEXT_PUBLIC_API_URL=http://localhost:8000`, baked into the client JS bundle
at image build time, passed as a Dockerfile `ARG`), while the frontend
container reaching the backend server-side (SSR, server components) has to
use the Compose network's service name instead (`API_URL=http://backend:8000`,
a plain runtime env var, never baked into the client bundle). Plain
`pnpm dev` on the host doesn't have this split — both env vars point at
`localhost:8000` there (see root `.env`). If you change the backend's
published port, update `NEXT_PUBLIC_API_URL` in both `docker-compose.yml`
(the frontend build `arg`) and `.env`.

`db`'s Postgres port is **not** published to the host on purpose — only
`backend` needs it, over the Compose network, and the host may already run
its own Postgres on 5432 (true on this machine — a large, unrelated shared
dev instance backs several other projects; never point this app at it).
Need a shell in? `docker compose exec db psql -U atelier atelier_store`.

## Running everything without Docker (local dev)

Needs a local Postgres (own database — don't reuse a shared one blindly;
`createdb atelier_store` or equivalent) and both services started manually,
backend first:

```
cd backend && uv sync && uv run alembic upgrade head && uv run python scripts/seed.py
uv run uvicorn atelier_api.main:app --reload --port 8000   # keep running
cd ..  && pnpm install && pnpm dev                          # in a second terminal
```

The frontend expects the backend reachable at `NEXT_PUBLIC_API_URL`/`API_URL`
(both default to `http://localhost:8000` in `.env` for this path — see the
Docker section above for why there are two).

## Frontend commands (this directory)

Package manager is **pnpm**.

```
pnpm dev      # start dev server (Turbopack) at localhost:3000 — needs the backend running
pnpm build    # production build — does NOT need the backend (see below)
pnpm lint     # ESLint (flat config, eslint-config-next + react-hooks rules)
pnpm start    # serve the production build (needs the backend running, same as dev)
```

Adding shadcn components:

```
pnpm dlx shadcn@latest add <component>
```

This CLI is the newer "registry" generation (`shadcn` v4.x with `radix-ui`
and `cn` as unified packages). Generated primitives land in
`src/components/ui/` and should be treated as generated code: extend via
composition in feature components rather than editing in place.

## Backend commands (`backend/`)

Dependency management is **uv**; run everything through `uv run` so it uses
the project's `.venv` (`uv sync` creates/updates it from `pyproject.toml`).

```
cd backend
uv sync                       # install/update dependencies into .venv
uv run uvicorn atelier_api.main:app --reload --port 8000
uv run alembic revision --autogenerate -m "message"   # after changing models/
uv run alembic upgrade head   # apply migrations
uv run python scripts/seed.py # seed the products table (idempotent, by slug)
uv run python scripts/make_admin.py <email>  # promote an existing account to admin (see "Admin panel")
uv run pytest                 # test suite — spins up/tears down atelier_store_test itself
uv run ruff check .           # lint (--fix to autofix)
```

First-time setup on a fresh machine: create a Postgres role/database (see
`backend/.env.example` for the expected `DATABASE_URL` shape,
`postgresql+asyncpg://…`), then `uv sync && uv run alembic upgrade head &&
uv run python scripts/seed.py`.

`backend/.env.example` also documents two optional vars: `STRIPE_SECRET_KEY`
(test-mode `sk_test_...`; unset by default — see "Payments") and
`FRONTEND_URL` (for building Stripe's success/cancel redirect URLs, default
`http://localhost:3000`).

Interactive API docs at `http://localhost:8000/docs` (Swagger) once the
server is running — the fastest way to explore the contract below.

## Backend architecture (`backend/src/atelier_api/`)

Layered, standard FastAPI-service shape:

```
core/config.py     Settings (pydantic-settings), reads backend/.env
core/security.py   password hashing (bcrypt), session token generation
core/payments.py   Stripe client init + stripe_enabled() feature-flag check
db/                 async engine + session (session.py), declarative Base (base.py)
models/             SQLAlchemy ORM: Product, Order, OrderItem, User, UserSession,
                    WishlistItem, NewsletterSubscriber
schemas/             Pydantic request/response models (never expose ORM models directly)
crud/               business logic — the only layer that touches the DB session
api/v1/endpoints/   thin FastAPI routers; parse request → call crud → return schema
exceptions.py       AppError hierarchy (NotFoundError → 404, base AppError → 400,
                    ConflictError → 409, UnauthorizedError → 401, ForbiddenError → 403),
                    registered as a global exception handler in main.py so routers
                    never need bare `raise HTTPException(...)`
```

**Pricing is always server-side.** `crud/order.py::create_order` takes only
`slug`/`size`/`quantity` per line from the client — it looks up each
product's *current* DB price and recomputes the subtotal itself. The
request schema (`OrderCreate`) has no price field at all, so there is
nothing for a client to tamper with. It also validates that the requested
size is actually in `product.sizes` before accepting the line.

**Alembic's `env.py` is wired to app `Settings`, not `alembic.ini`** — the
`sqlalchemy.url` in `alembic.ini` is deliberately left blank;
`get_settings().database_url` is the single source of truth for both the
app and migrations (see the top of `alembic/env.py`). Don't reintroduce a
hardcoded URL there.

**Tests are fully self-contained**: `tests/conftest.py` creates a separate
`atelier_store_test` database on first run (via a maintenance connection to
`postgres`), builds the schema straight from `Base.metadata` (no Alembic
needed for tests), and truncates all tables after every test function. It
overrides FastAPI's `get_db` dependency per-test via
`app.dependency_overrides`. Requires
`asyncio_default_fixture_loop_scope = "session"` in `pyproject.toml` — without
it, pytest-asyncio hands out a new event loop per test while the engine
fixture is session-scoped, which breaks asyncpg with "Event loop is
closed". Don't remove that setting.

## Authentication

Email/password accounts, server-side sessions, **httpOnly cookie** —
deliberately not a JWT-in-localStorage scheme (immune to being read/stolen
by injected JS; the cookie value is a meaningless random token without the
matching, unexpired DB row anyway).

- `users` (email/hashed-password via `bcrypt`) and `user_sessions`
  (`token` PK = the cookie value, `user_id`, `expires_at`) tables —
  `models/user.py`, `models/session.py`.
- `POST /auth/register`, `POST /auth/login` both set the cookie
  (`atelier_session`) via `Set-Cookie: ...; HttpOnly; SameSite=Lax`, and
  take a `remember_me` flag: `true` sets `Max-Age` (persists across browser
  restarts, 30 days by default — `session_max_age_seconds` in
  `core/config.py`); `false` omits `Max-Age`, making it an ordinary
  browser-session cookie. Either way the underlying `user_sessions` row
  expires the same; `remember_me` only controls how long the *browser*
  keeps the cookie.
- `POST /auth/logout` deletes the session row and clears the cookie.
  `GET /auth/me` returns the current user or 401.
- `core/security.py` — `bcrypt` hashing, `secrets.token_urlsafe(32)` for
  session tokens. `cookie_secure` in `core/config.py` is `False` for local
  HTTP dev; **must be `True` in any real HTTPS deployment.**
- **Authorization, not just authentication**: `orders.user_id` is nullable
  (guest checkout is still allowed — `POST /orders` associates the order
  with the caller only if a valid session cookie was sent, via
  `OptionalUser` in `api/deps.py`). `GET /orders/{id}` 403s unless the
  order has no owner (guest order) or the caller *is* the owner;
  `GET /orders/me` (must stay registered before `/orders/{order_id}` — same
  ordering trap as `/products/slugs`) lists only the caller's own orders
  and 401s if not signed in.
- `api/deps.py` exposes `CurrentUser` (401s if not signed in) and
  `OptionalUser` (`User | None`, never raises) as typed dependencies — use
  whichever matches whether the endpoint requires auth or just wants to
  know who's asking.

## Payments

Real Stripe **test-mode** Checkout Sessions, with a fallback so the app
works fully without a Stripe account:

- `core/payments.py::stripe_enabled()` is the single feature flag — true
  iff `settings.stripe_secret_key` is set. `crud/order.py::create_order`
  branches on it: if enabled, it creates the `Order` row (`pending_payment`)
  *then* a Stripe Checkout Session priced from that order's own
  `OrderItem`s (never client input — same server-side pricing as always),
  stores `stripe_session_id`, and returns a `checkout_url` for the frontend
  to redirect the browser to. If disabled, the order goes straight to
  `paid` and `checkout_url` is `null`.
- **No webhook** — this is a demo, so confirmation happens by reconciling
  on read instead: `crud/order.py::get_order` checks Stripe's session
  `payment_status` and flips `pending_payment` → `paid` if it's `"paid"`,
  every time the order is fetched. A production app should *also* verify
  via webhook, since a visitor who closes the tab before returning from
  Stripe would never hit this code path and the order would stay
  `pending_payment` forever.
- `OrderStatus` is just `pending_payment` | `paid` — no `demo_placed`
  anymore (migration `6e1532f21a1b` remaps old rows and swaps the Postgres
  enum type; SQLAlchemy/Alembic autogenerate can't detect enum *member*
  changes, so that migration is hand-written raw SQL, not generated).
- Frontend side: `src/app/checkout/page.tsx` calls `api.placeOrder(...)`;
  if the response has a `checkoutUrl`, it does
  `window.location.href = checkoutUrl` (cart is deliberately **not**
  cleared yet, so a cancelled Stripe session leaves the bag intact) and
  otherwise shows the immediate demo confirmation. `src/app/checkout/success/page.tsx`
  is where Stripe redirects back to (`?order_id=`); it calls
  `api.getOrderStatus(orderId)` — which hits `GET /orders/{id}` and thus
  triggers the reconciliation above — and only then clears the cart.
- Backend tests mock the Stripe SDK directly
  (`unittest.mock.patch("stripe.checkout.Session.create_async", ...)` etc.
  in `tests/test_payments.py`) rather than hitting the real API, since
  there's no Stripe account wired into CI/dev by default.

## Product discovery, wishlist, and order tracking

- **Search/sort** (`/products?search=&sort=`) are backend-side
  (`crud/product.py::list_products` — `search` is a simple `ILIKE` on
  name; `sort` is `newest` / `price_asc` / `price_desc`), not client
  filtering, so results stay shareable/bookmarkable. The header's search
  icon (`site-header.tsx`) opens a `Sheet` with a form that navigates to
  `/products?search=...`; `components/sort-select.tsx` is a `<select>`
  that rewrites the current query string's `sort` param client-side.
- **Recently Viewed** (`src/lib/recently-viewed.ts`,
  `components/recently-viewed-rail.tsx`) is pure `localStorage`, unrelated
  to the account system — there's no server-side "this visitor" concept
  for it. It records a lightweight snapshot (slug/name/price/mark/category,
  not a full `Product`) on every PDP visit and renders the rest of the
  list, excluding the current product.
- **Wishlist is per-account, not client-only** (unlike the cart) — it's
  the one place a signed-out visitor gets redirected to sign in
  mid-action: `components/wishlist-button.tsx` optimistically toggles,
  calls `api.addToWishlist`/`removeFromWishlist`, and on a 401 rolls back
  and pushes to `/account/login?returnTo=<current path>`. Server components
  that render `ProductGrid` fetch the signed-in visitor's wishlisted slugs
  via `auth-server.ts::getMyWishlistSlugs()` (cookie-forwarded, returns an
  empty `Set` rather than erroring when signed out) and pass them down as
  `wishlistedSlugs` so hearts render filled without a client round-trip.
  `wishlist_items` has a `(user_id, product_id)` unique constraint; adding
  twice is a no-op (`ON CONFLICT DO NOTHING`), matching the newsletter
  table's idempotency pattern.
- **Order tracking is deliberately honest about being a demo**:
  `components/order-timeline.tsx` only ever marks "Order Placed" and
  "Payment Confirmed" as reached (driven by real `OrderStatus`); "Processing
  / Shipped / Delivered" are always rendered greyed-out with a note that
  this store doesn't fulfill orders. Don't make those steps "complete" for
  a `paid` order — there's no fulfillment system behind them, and doing so
  would fabricate progress that never happens. `/account/orders/[id]` is
  the detail page (ownership-checked the same way the API does — it calls
  `auth-server.ts::getOrder()`, which returns `null` on a 403/404 from the
  backend and the page does `notFound()`); `/account` links each order row
  to it and shows `components/order-status-badge.tsx` for the summary state.
- `/about` and `/support` are static content pages that exist specifically
  to back the footer's `#materials`/`#shipping`/`#privacy`/etc. anchor
  links, which were dead (404) before — if you add a new footer link,
  add the matching `<section id="...">` rather than leaving another
  dead anchor.

## Admin panel

Role-based, not a full roles system: a single `users.is_admin` boolean
(`models/user.py`), not a separate roles/permissions table — deliberately
minimal for a demo of this scale.

- **No self-serve promotion endpoint, by design.** The only way to make an
  account an admin is `backend/scripts/make_admin.py <email>`, run directly
  against the DB (`uv run python scripts/make_admin.py <email>` locally, or
  `docker exec atelier-store-backend-1 python scripts/make_admin.py <email>`
  against the Compose stack). It refuses if the account doesn't exist yet
  (register normally first). There is no API route that can flip
  `is_admin` — keeping that off the HTTP surface entirely is the point.
- **`AdminUser` dependency** (`api/deps.py`) — `get_current_admin` raises
  `ForbiddenError` (403) if `current_user.is_admin` is false; `AdminUser`
  is the `Annotated[User, Depends(get_current_admin)]` alias. The whole
  admin router (`api/v1/endpoints/admin.py`) is mounted with
  `APIRouter(prefix="/admin", dependencies=[Depends(get_current_admin)])`,
  so every route under `/admin/*` is gated once at the router level rather
  than repeating the dependency per-endpoint.
- **Admin product mutations still go through the same `ProductCreate`/
  `ProductUpdate` Pydantic schemas** as everything else (slug pattern,
  `price > 0`, non-empty `sizes`) — being an admin doesn't bypass
  validation. `update_product` uses `model_dump(exclude_unset=True)` so a
  PATCH can distinguish "field omitted" from "field explicitly set to
  `null`" (needed to let an admin clear `compare_at_price`).
- **Frontend: `/admin/*` is its own route group-free area, sitting outside
  `(storefront)`.** The rest of the app (`about/`, `account/`, `checkout/`,
  `products/`, `support/`, the homepage) lives under
  `src/app/(storefront)/`, which owns `CartProvider` + `SiteHeader` +
  `SiteFooter`; `src/app/layout.tsx` itself is now just
  `<html>`/`<body>`/fonts, with no providers, so `/admin` gets its own
  sidebar-based chrome (`src/app/admin/layout.tsx`) instead of inheriting
  storefront cart/header/footer. If you add a new top-level storefront
  page, put it under `(storefront)/`, not directly under `app/`.
  `src/app/admin/layout.tsx` is also the auth gate: redirects to
  `/account/login?returnTo=/admin` if signed out, to `/` if signed in but
  not an admin.
- **Data layer mirrors the existing auth split**: `src/lib/admin-server.ts`
  (server-only, cookie-forwarded reads via `forwardedGet()` in
  `src/lib/server-fetch.ts` — the same helper `auth-server.ts` uses) for
  every admin page's initial data, and `src/lib/admin.ts` (client-side,
  `credentials: "include"`) for the create/update/delete mutations fired
  from `product-form.tsx` and `delete-product-button.tsx`.
- **Finance/reporting** (`/admin/finance`, `crud/admin.py`,
  `schemas/admin.py`) — `GET /admin/finance/summary`,
  `.../revenue?period=daily&limit=`, `.../revenue-by-category`,
  `.../transactions`. Revenue queries use Postgres
  `func.date_trunc()`/`cast(..., Date)` bucketing and only ever count
  `OrderStatus.paid` orders (`pending_payment` orders show up separately as
  "pending payment value", never counted as revenue).
- **Charts are hand-rolled, no charting library.** `revenue-chart.tsx`
  (vertical bars, single series) and `category-revenue-chart.tsx`
  (horizontal bars, one color per category from a fixed hue map) follow the
  project's dataviz skill: validated categorical palette, ≤24px bars with a
  4px rounded end, direct value labels, a legend only where ≥2 series
  exist. **`category-revenue-chart.tsx` renders its bars and labels as
  plain HTML/CSS (flex rows + a colored `div` per bar), not SVG** — an
  earlier SVG version put `<text>` inside a `viewBox` with
  `preserveAspectRatio="none"`, which non-uniformly stretches everything
  including glyphs and made the category labels render as huge, garbled
  shapes once the container was wider than tall. `revenue-chart.tsx` still
  uses SVG for its bars but keeps all text in an HTML sibling below the
  `<svg>` for the same reason — never put `<text>` inside a
  `preserveAspectRatio="none"` SVG.
- **`DeleteProductButton` uses `window.confirm()`** before calling
  `deleteAdminProduct`. This is a real native dialog (not a styled
  in-app modal) — fine for a click in a real browser, but it blocks
  CDP-driven browser automation (the tab appears to hang until a human
  dismisses the dialog). Keep that in mind if scripting/testing this flow.

## API surface (`/api/v1`, exact shapes in `/docs`)

- `GET /products?category=&is_new=&search=&sort=&limit=&offset=` → paginated
  `{items, total, limit, offset}` — `sort` is `newest` (default) /
  `price_asc` / `price_desc`.
- `GET /products/slugs` → `string[]` (not currently called by the frontend —
  every route is dynamic/per-request now that auth reads cookies in
  `RootLayout`, so there's no `generateStaticParams` needing it anymore;
  kept as a generically useful endpoint, e.g. for a future sitemap. **Must**
  stay registered before `/products/{slug}` in `api/v1/endpoints/products.py`
  or FastAPI will match `/slugs` as a slug value if you ever do wire it back
  up).
- `GET /products/{slug}`, `GET /products/{slug}/related?limit=`
- `GET /categories` → the fixed four-category taxonomy (not a DB table —
  it's product metadata, not data that changes at runtime).
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`,
  `GET /auth/me` — see "Authentication" above.
- `POST /orders` → `{order, checkout_url}` (see "Payments" — `checkout_url`
  is `null` unless Stripe is configured), `GET /orders/me` (auth required),
  `GET /orders/{order_id}` (owner-only if the order has an owner, and
  reconciles with Stripe on read — see "Payments").
- `GET /wishlist`, `GET /wishlist/slugs`, `POST /wishlist/{slug}`,
  `DELETE /wishlist/{slug}` — all auth required (see "Product discovery,
  wishlist, and order tracking").
- `POST /newsletter` — idempotent (`ON CONFLICT DO NOTHING` on email),
  always returns 201 whether or not the email was already subscribed.
- `GET /health` — checks DB connectivity, for uptime probes.
- `/admin/*` — admin-only (see "Admin panel"): `GET /admin/stats`;
  `GET/POST /admin/products`, `GET/PATCH/DELETE /admin/products/{id}`;
  `GET /admin/orders`, `GET /admin/orders/{id}`; `GET /admin/users`;
  `GET /admin/newsletter`; `GET /admin/finance/summary`,
  `GET /admin/finance/revenue`, `GET /admin/finance/revenue-by-category`,
  `GET /admin/finance/transactions`.

All JSON is **snake_case** (Python/FastAPI convention). The frontend never
sees this shape directly — see below.

## Frontend architecture (`src/`)

**`src/lib/api.ts` is the only thing that talks to the backend from client
code** (server components go through `auth-server.ts` instead when they
need cookie-forwarded/authenticated data — see below). It fetches from
`getApiUrl()` (see the Docker section) with `cache: "no-store"` and
`credentials: "include"` on every call, and translates the backend's
snake_case DTOs (`compare_at_price`, `is_new`, …) into the camelCase
`Product` domain type (`compareAtPrice`, `isNew`, …) that every component
uses. **Never import snake_case field names into a component** — if you
need a new backend field, add it to the DTO type and the `fromDTO` mapper
in `api.ts`, not ad-hoc in the component. Product fetching is one function,
`getProducts({ category?, search?, sort? })`, not separate
per-filter functions — add new filters as params there, not as new
top-level exports.

`src/lib/products.ts` is intentionally backend-agnostic: just the `Category`
type/list, `isCategory`, and `formatPrice`. It has zero knowledge of HTTP or
the database — that split exists so client components (like the checkout
form) can import `formatPrice` without pulling in fetch/API code, and so
this module stays trivially unit-testable.

**Auth has its own client/server split, separate from the products one.**
A Next.js server component makes its own HTTP request to the backend — it
does **not** share the browser's cookie jar, so reading `next/headers`
`cookies()` and manually replaying them as a `Cookie` header on the
outgoing fetch is the only way for a server component to act "as" the
signed-in visitor. That forwarding lives in `src/lib/auth-server.ts`
(`import "server-only"` — guards against it ever landing in a client
bundle) via `getCurrentUser()`, `getMyOrders()`/`getOrder()`, and
`getMyWishlist()`/`getMyWishlistSlugs()`. `src/lib/auth.ts` is
the client-side counterpart (`login`/`register`/`logout`, used from
`"use client"` forms) — it relies on the browser's own cookie jar via
`fetch(..., { credentials: "include" })`, which is also why `api.ts`'s
shared `apiFetch` sets `credentials: "include"` on every call (a no-op
server-side, required for `placeOrder` to associate an order with a
logged-in user). **Don't import `auth-server.ts` from a `"use client"`
file** — the `server-only` guard will fail the build if you do; use
`auth.ts` there instead. `RootLayout` (`src/app/layout.tsx`) is the one
place that calls `getCurrentUser()` and passes the result into
`<SiteHeader user={...} />` — this is also why the entire app is now
`ƒ` (dynamic) rather than statically prerendered: reading `cookies()`
anywhere upstream of a route forces every page under it to render
per-request, since the response depends on who's asking.

**Cart is client-only state**, unrelated to the backend split above.
`src/lib/cart-context.tsx` is a `"use client"` React context
(`CartProvider`/`useCart`) holding cart lines in `useState`, persisted to
`localStorage` under `atelier-cart`. It starts empty on both server and
first client render, then hydrates from `localStorage` in a `useEffect` —
hence the `eslint-disable-next-line react-hooks/set-state-in-effect` next to
that call; the lint rule's usual advice (derive state during render) would
break SSR/client hydration parity here.

**Checkout calls the backend directly from the client.** `/checkout`
(`src/app/checkout/page.tsx`) is a `"use client"` page; on submit it calls
`api.placeOrder(shipping, lines)` — see "Payments" above for the
Stripe-redirect-vs-immediate-demo branch this triggers. The `orderId`
confirmation state (demo path only) is held in the **top-level**
`CheckoutPage` component, not inside the form component — clearing the
cart flips `lines.length === 0`, and if the "empty bag" branch were
checked in the same component holding `orderId`, that branch would win and
the confirmation screen would never render. Keep that ordering (`orderId`
check before the empty-cart check) if you touch this file.

**No real product photography.** `src/components/product-plate.tsx`
(`ProductPlate`) is a deliberate stand-in: a tonal gradient box (`.plate` /
`.plate-mark` utilities in `globals.css`) showing the product's single-letter
`mark` in the display serif, italic, at low opacity — used everywhere a
product image would normally go. There is no `next/image` usage anywhere in
the app for this reason.

**Design tokens live in `src/app/globals.css`**, on top of shadcn's
Tailwind v4 `@theme inline` token block. Intentional deviations from shadcn
defaults:
- Warm off-white/near-black palette instead of shadcn's neutral grayscale;
  a single restrained accent (oxblood, `--accent`) reserved for price
  emphasis, sale badges, and "new" states — never for large surfaces or
  primary buttons.
- `--radius` is `0px` everywhere (sharp rectangles: buttons, inputs, cards,
  size swatches) — a deliberate "architectural" look, not an oversight.
- Two font roles set up in `src/app/layout.tsx` via `next/font/google`:
  `--font-heading` (Fraunces, variable weight, italic used for most display
  headings) and `--font-sans` (Inter, body/UI text). `h1`–`h4` get
  `font-heading` by default via `@layer base`.
- Component utilities in `@layer components`: `.shell` (page gutter/max-width
  container), `.label-tracked` (uppercase tracked micro-labels), `.link-underline`
  (the site's signature hover state — an animated hairline underline), and
  `.plate`/`.plate-mark` (see above).
- `prefers-reduced-motion` is handled globally at the bottom of
  `globals.css`, not per-component.

**Routing**: `/`, `/products` (category/search/sort via query params,
resolved against the backend — not client state, so results stay
shareable/bookmarkable), `/products/[slug]` (rendered per-request, not
statically generated — see the dynamic-rendering note above), `/checkout`
and `/checkout/success` (see "Payments"), `/about`, `/support` (static
content — see "Product discovery, wishlist, and order tracking"). All of
these live under `src/app/(storefront)/` (a route group, not a URL
segment) so they share `CartProvider`/`SiteHeader`/`SiteFooter` without
leaking that chrome into `/admin/*` — see "Admin panel". `products/`
has its own `loading.tsx`, `error.tsx`, and `[slug]/not-found.tsx`; there's
also a root `not-found.tsx`.

**`/account/*`**: `/account/login` and `/account/register` are `"use
client"` pages wrapped in `<Suspense>` (required because they call
`useSearchParams()` to read `?returnTo=`, which needs a Suspense boundary
during prerendering — see the `LoginForm`/`RegisterForm` split in each
file) and redirect to `returnTo` (default `/account`) on success, mirroring
the "sign in, then go back where you were" pattern instead of always
landing on a fixed page — the same pattern `wishlist-button.tsx` uses when
a signed-out visitor tries to save an item. `/account` itself is a server
component that calls `getCurrentUser()` and `redirect()`s to
`/account/login?returnTo=/account` if there's no session, otherwise renders
the account + order history (`getMyOrders()`) with links to
`/account/orders/[id]` (full detail + tracking timeline) and
`/account/wishlist` (saved products).

**Interactive state boundaries:** pages under `products/` are `async` server
components that `await` `src/lib/api.ts` calls directly; anything needing
`useCart`, size selection, or the mobile/cart sheets is split into a small
`"use client"` leaf component (e.g. `add-to-bag-panel.tsx`,
`site-header.tsx`, `cart-sheet.tsx`, `newsletter-form.tsx`) rather than
making the whole page client-rendered.
