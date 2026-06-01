# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keyboard Market is a full-stack marketplace for buying and selling keyboards. The repo has two separate apps:
- **`frontend/`** — React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui, hosted on Vercel
- **`backend/`** — NestJS + MongoDB Atlas + JWT auth (httpOnly cookies) + Socket.io, hosted on Fly.io at api.benzivillaruel.com

## Commands

### Root
```bash
npm run dev   # Start both backend (watch) and frontend concurrently
```

### Frontend (`cd frontend`)
```bash
npm run dev       # Vite dev server on port 5173
npm run build     # TypeScript check + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Backend (`cd backend`)
```bash
npm run start:dev          # NestJS watch mode on port 8080
npm run build              # Compile TypeScript to dist/
npm test                   # Run Jest unit tests (*.spec.ts in src/)
npm run test:e2e           # Run Jest E2E tests (test/jest-e2e.json config)
npm run test -- --testPathPattern=group-buys  # Run a single test file
```

## Architecture

### Frontend

- **Routing:** React Router v7 — routes in [frontend/src/App.tsx](frontend/src/App.tsx); `ProtectedRoute` guards auth-required pages; `AdminRoute` guards `/admin/*` by comparing `user.id` to `VITE_ADMIN_USER_ID` env var
- **Auth:** `AuthProvider` calls `GET /api/auth/me` on mount to restore session; JWT stored in httpOnly cookie (no manual token handling); 401 response triggers logout + redirect to `/`
- **API:** Axios instance at `src/utils/api.ts` with `withCredentials: true`; Vite proxies `/api` → `localhost:8080` in dev via [frontend/vite.config.ts](frontend/vite.config.ts); production uses `vercel.json` rewrite to `api.benzivillaruel.com/keyboard-market/api/*`
- **Real-time chat:** Socket.io managed by `websocketService.ts` (singleton); connects with `?userId=X` query param; listens for `chat.message`, emits `chat.send`; `ChatProvider` tracks activeChat state; `ChatManager` renders floating, draggable `Chat` and `ConversationsList` windows
- **UI:** shadcn/ui (Radix UI + Tailwind); path alias `@/` → `src/`; theme uses `--km-*` CSS custom properties; dark/light mode via `ThemeProvider`
- **Admin pages:** `frontend/src/pages/admin/` — `GroupBuysAdmin` (table view with hide/edit), `GroupBuyEditModal` (tabbed editor, DND image reorder), `ScraperPreview` (SSE live log + bulk import)

### Backend

- **Entry point:** [backend/src/main.ts](backend/src/main.ts) — global `/api` prefix, validation pipe (whitelist + transform), `AllExceptionsFilter`, CORS from `CORS_ORIGINS` env
- **Modules:** `AuthModule`, `UsersModule`, `ListingsModule`, `GroupBuysModule`, `ChatModule`
- **JWT:** Stored in httpOnly cookie (`jwt`); `JwtStrategy` reads `req.cookies.jwt`; `JwtAuthGuard` (Passport) protects endpoints; payload is `{ sub: userId }`, 2-hour expiration signed with `JWT_SECRET`
- **Admin guard:** `AdminGuard` compares `req.user.userId` to `ADMIN_USER_ID` env var; throws `ForbiddenException` if mismatch; applied alongside `JwtAuthGuard` on admin endpoints
- **WebSocket:** Socket.io gateway (`ChatGateway`); clients join a room named by their userId on connect; `chat.send` event saves message to DB and emits `chat.message` to both sender and receiver rooms
- **Database:** MongoDB Atlas via Mongoose; `DB_URL` env var; `_id` → `id` transform applied globally; `group-buys` collection uses `strict: false` to accommodate arbitrary scraped fields
- **Scraper integration:** `GroupBuysService.scraperStream()` runs `runScraper()` from `backend/src/group-buys/scraper.ts` (TypeScript, no subprocess); scraper paginates Geekhack RSS board 70, fetches thread HTML, parses posts with Cheerio, and calls Google Gemini (`GEMINI_API_KEY`) to extract structured GB data; returns an RxJS Observable of SSE `MessageEvent`s; 120s timeout; 2s delay between topic fetches

### API Endpoints

**Auth** — `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` (guarded)

**Listings** — `POST /api/listings` (guarded), `GET /api/listings/all`, `GET /api/listings/filtered` (paginated, accepts `minPrice/maxPrice/offers/condition/title/sortBy/sortDirection/page/size`), `GET /api/listings/:id`, `GET /api/listings/details/:id` (includes seller info + listing count), `GET /api/listings/username/:username`

**Chat** — `GET /api/chat/history?userId1=X&userId2=Y` (guarded), `GET /api/chat/conversations/:userId` (guarded, aggregation pipeline)

**Group Buys (public)** — `GET /api/groupbuys?stage=IC|GB|closed`, `GET /api/groupbuys/counts`, `GET /api/groupbuys/:id`

**Group Buys (admin, requires `JwtAuthGuard` + `AdminGuard`)** — `GET /api/groupbuys/admin/all?status=X`, `GET /api/groupbuys/admin/:id`, `PATCH /api/groupbuys/admin/:id`, `GET /api/groupbuys/admin/scrape/stream` (SSE), `POST /api/groupbuys/admin/import` (bulk upsert by `topic_id`)

### Key Models
| Model | Key Fields |
|-------|------------|
| `User` | email, username, password (hashed), dateJoined |
| `Listing` | title, description (max 1000), price (optional), offers (bool), condition (string), imageUrl, userId, createdOn |
| `ChatMessage` | senderId, receiverId, content, timestamp, read; collection: `messages` |
| `GroupBuy` | topic_id, name, type, status, designer, overview, poster, gb_start/gb_end, estimated_fulfillment, base_price (Object), items[], vendors[], images[], excludedImages[], hidden (bool), scraped_at; collection: `group-buys` |

### Group Buy Status Logic

- `status` is stored as-is from the scraper (`IC`, `GB`, `closed`, etc.)
- `buildStageQuery()` in the service maps the `stage` query param to a MongoDB filter
- GBs with a `gb_end` in the past are treated as "closed" automatically in `toPublicShape()`
- `hidden: true` suppresses a group buy from all public endpoints
- `excludedImages[]` is a soft-delete for individual images (kept in DB, not shown publicly)
- `GET /api/groupbuys/counts` includes a "closing soon" count (GBs ending within 48h)

### Shape Transformation Pattern

`toPublicShape()` and `toAdminShape()` in `GroupBuysService` explicitly map DB docs to API responses. Admin shape includes `poster`, `excludedImages`, and `hidden`; public shape omits them. `GroupBuyEditModal` has its own `toImportPayload()` for the reverse direction.

## Environment Variables

**Backend** (`backend/.env`):
- `DB_URL` — MongoDB Atlas connection string
- `JWT_SECRET` — EC private key for JWT signing
- `CORS_ORIGINS` — Comma-separated allowed origins (defaults to `http://localhost:5173`)
- `ADMIN_USER_ID` — MongoDB `_id` of the admin user; checked by `AdminGuard`
- `GEMINI_API_KEY` — Google Gemini API key; required for the scraper to run
- `GEMINI_MODEL` — Gemini model ID (optional; defaults to `gemini-3.1-flash-lite`)

**Frontend** (`frontend/.env`):
- `VITE_API_URL` — Backend URL (leave empty in dev; proxy handles it)
- `VITE_ADMIN_USER_ID` — Must match `ADMIN_USER_ID` in backend; used by `AdminRoute` for client-side guard

## Deployment

- **Frontend:** Vercel — `vercel.json` rewrites `/api/*` to `https://api.benzivillaruel.com/keyboard-market/api/*` and catches all routes for SPA history fallback
- **Backend:** Fly.io (`fly.toml`, app: `kbm-backend`, region: `ewr`); multi-stage `Dockerfile` builds from Node 22 Alpine; health check at `GET /health` every 30s; auto-scales to 0 when idle
