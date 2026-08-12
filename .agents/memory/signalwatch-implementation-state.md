---
name: SignalWatch implementation state
description: Tracks what has been built and what remains for the SignalWatch SaaS.
---

## What is done

### Backend (artifacts/api-server)
- Clerk middleware (`@clerk/express`) + proxy middleware for production
- `requireAuth` middleware — every protected route reads `req.userId` from Clerk
- All routes in `src/routes/signalwatch.ts`, isolated by `clerkUserId`
- Mercado Pago adapter via raw fetch; token from `MERCADOPAGO_ACCESS_TOKEN` env secret
- Telegram connector real: `src/lib/telegramService.ts` — QR code auth, session encryption (AES-256-GCM), message listener, group sync, session restore on startup
- Admin detection: `SIGNALWATCH_ADMIN_EMAILS` env var → Clerk API lookup → `isAdmin=true` + `planId='admin'` (unlimited)
- `bufferutil` and `utf-8-validate` added as direct deps of api-server to fix pnpm resolution issue
- `pnpm.onlyBuiltDependencies` set in root package.json for bufferutil, utf-8-validate, @clerk/shared, es5-ext

### Database (lib/db)
Tables with all columns migrated to dev PostgreSQL:
- `signalwatch_profiles` — `isAdmin boolean` column added
- `signalwatch_groups`, `signalwatch_rules`, `signalwatch_alerts`, `signalwatch_connections`, `signalwatch_checkouts`

### Frontend (artifacts/signalwatch)
- Real Clerk auth: `ClerkProvider` wrapping app, `SignIn`/`SignUp` Clerk components at `/sign-in` and `/sign-up`
- `ProtectedRoute` redirects to `/sign-in` when signed out; home redirects to `/app` when signed in
- `AppShell` uses `useUser()` for name/avatar, `useClerk().signOut()` for logout button
- Clerk appearance: teal theme with SignalWatch brand colors, logo at `public/logo.svg`
- Clerk localization: PT-BR titles ("Bem-vindo de volta.", "Crie seu radar.")
- Session cache invalidation via `ClerkQueryClientCacheInvalidator`
- ConnectionPage: shows real QR code (base64 PNG from backend), polls status every 3s after QR is shown
- Clerk layer declared in index.css before tailwindcss import
- vite.config.ts: `tailwindcss({ optimize: false })` to prevent Clerk styles breaking in prod

### Secrets configured
- `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `SESSION_SECRET` — active
- `TELEGRAM_API_ID`, `TELEGRAM_API_HASH` — active (real user credentials)
- `SIGNALWATCH_ADMIN_EMAILS` — set to admin email for unlimited access
- `MERCADOPAGO_ACCESS_TOKEN` — NOT YET set, user will provide later

## What remains

1. **Telegram 2FA** — if user has 2FA enabled, current flow throws an error. Would need a UI flow to collect the password.
2. **Mercado Pago** — wired but disabled until `MERCADOPAGO_ACCESS_TOKEN` is set.
3. **Production DB migration** — after deploy, run `pnpm --filter @workspace/db run push` against prod DB.

## Key quirks / non-obvious decisions

- `bufferutil`/`utf-8-validate` are in esbuild `external[]` list AND must be direct deps of api-server (pnpm won't hoist otherwise) — both conditions required.
- Root `package.json` must have `pnpm.onlyBuiltDependencies` to allow native module build scripts.
- Clerk `publishableKeyFromHost` from `@clerk/react/internal` — never the raw env var directly.
- Telegram QR auth: `client.signInUserWithQrCode()` runs in background; HTTP endpoint returns immediately with first QR (wait max 8s). Frontend polls `/connection/status` every 3s to detect scan.
- Admin plan `id='admin'` is not in `BILLING_PLANS` array — `getBillingPlan()` handles it separately.
