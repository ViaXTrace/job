---
name: SignalWatch implementation state
description: Tracks what has been built and what remains for the SignalWatch SaaS.
---

## What is done

### Backend (artifacts/api-server)
- Clerk middleware integrated (`@clerk/express`, proxy middleware for production)
- `requireAuth` middleware — every protected route reads `req.userId` from Clerk
- All routes live in `src/routes/signalwatch.ts`, isolated by `clerkUserId`
- Mercado Pago adapter via raw fetch (no SDK); token from `MERCADOPAGO_ACCESS_TOKEN` env secret
- Webhook endpoint at `POST /api/billing/webhook` (public, validates payment from MP)
- Telegram connector guard via `telegramConnectorAvailable()` — returns unavailable state when env vars are missing
- `src/lib/signalwatch.ts` — billing plans definition, `ensureWorkspace`, `connectionDto`, `getBillingPlan`

### Database (lib/db)
Tables created and migrated to dev PostgreSQL:
- `signalwatch_profiles` — per-user preferences and billing state
- `signalwatch_groups` — Telegram groups with monitoring state
- `signalwatch_rules` — keyword rules per user
- `signalwatch_alerts` — matched alerts
- `signalwatch_connections` — Telegram session state (session ciphertext encrypted field reserved)
- `signalwatch_checkouts` — Mercado Pago Pix checkout tracking

### Frontend (artifacts/signalwatch)
- Landing page (extracted to `src/pages/Landing.tsx` — proper JSX)
- App shell with sidebar, nav, mobile drawer, plan usage widget
- Dashboard: metrics, recent alerts, plan usage bar, next-step card
- Alerts page: search, period filter, read/favorite/archive actions
- Rules page: list + create/edit modal with keyword fields
- Groups page: monitoring toggle, sync action
- Connection page: QR code flow (shows unavailable state until Telegram credentials added)
- Billing page: plan cards, cycle toggle, Pix checkout creation
- Settings page: language/timezone/format/notifications preferences
- Onboarding page: 3-step wizard
- Auth pages: sign-in and sign-up (visual shells — Clerk UI integration pending)
- Legal pages: terms and privacy

## What remains

1. **Clerk UI integration in frontend** — replace mock AuthPage with real `<SignIn>` and `<SignUp>` Clerk components; add `useAuth` hook to AppShell for real user name/avatar and sign-out.
2. **Telegram conector real** — requires `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` env secrets; then `telegramConnectorAvailable()` returns true and the QR flow activates.
3. **Mercado Pago token** — user will provide via Replit secrets flow; already wired, just needs `MERCADOPAGO_ACCESS_TOKEN` set.
4. **Background Telegram listener** — when session is active, listen to group messages and match against rules to create alerts in real time.

## Why app shows 401 without login
Expected behavior. The API requires Clerk JWT on every route except the billing webhook. The frontend uses fallback data when API calls fail.
