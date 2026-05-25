# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keyboard Market is a full-stack marketplace for buying and selling keyboards. The repo has two separate apps:
- **`frontend/`** — React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui, hosted on Vercel
- **`backend/`** — NestJS + MongoDB Atlas + JWT auth (httpOnly cookies) + Socket.io, hosted at api.benzivillaruel.com

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
npm run start:dev   # NestJS watch mode on port 8080
npm run build       # Compile TypeScript to dist/
npm test            # Run Jest unit tests
npm run test:e2e    # Run Jest E2E tests (test/jest-e2e.json config)
```

## Architecture

### Frontend

- **Routing:** React Router v7 — routes in [frontend/src/App.tsx](frontend/src/App.tsx); protected routes use `ProtectedRoute` wrapper
- **Auth:** `AuthProvider` calls `GET /api/auth/me` on mount to restore session; JWT stored in httpOnly cookie (no manual token handling); 401 response triggers logout + redirect to `/`
- **API:** Axios instance at `src/utils/api.ts` with `withCredentials: true`; Vite proxies `/api` → `localhost:8080` in dev via [frontend/vite.config.ts](frontend/vite.config.ts); production uses `vercel.json` rewrite
- **Real-time chat:** Socket.io managed by `websocketService.ts` (singleton); connects with `?userId=X` query param; listens for `chat.message`, emits `chat.send`; `ChatProvider` tracks activeChat state; `ChatManager` renders floating, draggable `Chat` and `ConversationsList` windows
- **UI:** shadcn/ui (Radix UI + Tailwind); path alias `@/` → `src/`; theme uses `--km-*` CSS custom properties; dark/light mode via `ThemeProvider`

### Backend

- **Entry point:** [backend/src/main.ts](backend/src/main.ts) — global `/api` prefix, validation pipe (whitelist + transform), `AllExceptionsFilter`, CORS from `CORS_ORIGINS` env
- **Modules:** `AuthModule`, `UsersModule`, `ListingsModule`, `GroupBuysModule`, `ChatModule`
- **JWT:** Stored in httpOnly cookie (`jwt`); `JwtStrategy` reads `req.cookies.jwt`; `JwtAuthGuard` (Passport) protects endpoints; payload is `{ sub: userId }`, 2-hour expiration signed with `JWT_SECRET`
- **WebSocket:** Socket.io gateway (`ChatGateway`); clients join a room named by their userId on connect; `chat.send` event saves message to DB and emits `chat.message` to both sender and receiver rooms
- **Database:** MongoDB Atlas via Mongoose; `DB_URL` env var; `_id` → `id` transform applied globally; collections: `users`, `listings`, `messages`, `group-buys`

### API Endpoints

**Auth** — `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` (guarded)

**Listings** — `POST /api/listings` (guarded), `GET /api/listings/all`, `GET /api/listings/filtered` (paginated, accepts `minPrice/maxPrice/offers/condition/title/sortBy/sortDirection/page/size`), `GET /api/listings/:id`, `GET /api/listings/details/:id` (includes seller info + listing count), `GET /api/listings/username/:username`

**Chat** — `GET /api/chat/history?userId1=X&userId2=Y` (guarded), `GET /api/chat/conversations/:userId` (guarded, aggregation pipeline)

**Group Buys** — `GET /api/groupbuys?status=X`

### Key Models
| Model | Key Fields |
|-------|------------|
| `User` | email, username, password (hashed), dateJoined |
| `Listing` | title, description (max 1000), price (optional), offers (bool), condition (string), imageUrl, userId, createdOn |
| `ChatMessage` | senderId, receiverId, content, timestamp, read; collection: `messages` |
| `GroupBuy` | topic_id, name, status, designer, gb_start/gb_end, base_price, vendors, images; collection: `group-buys` |

## Environment Variables

**Backend** (`backend/.env`):
- `DB_URL` — MongoDB Atlas connection string
- `JWT_SECRET` — EC private key for JWT signing
- `CORS_ORIGINS` — Comma-separated allowed origins (defaults to `http://localhost:5173`)

**Frontend** (`frontend/.env`):
- `VITE_API_URL` — Backend URL (leave empty in dev; proxy handles it)
