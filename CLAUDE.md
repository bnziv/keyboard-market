# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keyboard Market is a full-stack marketplace for buying and selling keyboards. The repo has two separate apps:
- **`frontend/`** — React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui, hosted on Vercel
- **`backend/`** — Spring Boot 3.4.2 + MongoDB Atlas + JWT auth + WebSockets, hosted at api.benzivillaruel.com

## Commands

### Frontend (`cd frontend`)
```bash
npm run dev       # Start dev server on port 5173
npm run build     # TypeScript check + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Backend (`cd backend`)
```bash
./gradlew bootRun   # Start Spring Boot on port 8080
./gradlew build     # Build JAR
./gradlew test      # Run tests
./gradlew clean     # Clean build artifacts
```

## Architecture

### Frontend

- **Routing:** React Router v7 — routes defined in [frontend/src/App.tsx](frontend/src/App.tsx)
- **Auth:** JWT token managed by `AuthProvider` context in [frontend/src/utils/](frontend/src/utils/); protected routes use `ProtectedRoute` component
- **API:** Axios with `credentials: true`; in dev, Vite proxies `/api` to `localhost:8080` via [frontend/vite.config.ts](frontend/vite.config.ts)
- **Real-time chat:** STOMP over WebSocket (SockJS) managed by `ChatProvider` context; `ChatManager` component handles active conversations
- **UI:** shadcn/ui components (Radix UI primitives + Tailwind CSS); path alias `@/` maps to `src/`
- **Deployment:** [frontend/vercel.json](frontend/vercel.json) rewrites `/api/*` to the production backend

### Backend

- **Entry point:** [backend/src/main/java/com/keyboardmarket/KeyboardMarketBackendApplication.java](backend/src/main/java/com/keyboardmarket/KeyboardMarketBackendApplication.java)
- **Security:** `JwtAuthenticationFilter` validates Bearer tokens on every request; `SecurityConfig` marks POST `/api/listings` as requiring auth; all else is public; stateless sessions, no CSRF
- **JWT:** Signed with EC private key (`JWT_SECRET` env var), 2-hour expiration; issued on login, validated via `/api/auth/me`
- **WebSocket:** STOMP broker at `/ws`; destinations use `/topic/` (broadcast) and `/user/` (direct messages)
- **Database:** MongoDB Atlas via `DB_URL` env var; Spring Data repositories; auto-index creation enabled
- **CORS:** Controlled by `CORS_ORIGINS` env var (defaults to `http://localhost:5173`)

### Key Models
| Model | Description |
|-------|-------------|
| `User` | Auth details, profile info |
| `Listing` | Keyboard/parts listings with search/filter fields |
| `ChatMessage` | Real-time chat messages linked to users and listings |

## Environment Variables

**Backend** (`backend/.env`):
- `DB_URL` — MongoDB Atlas connection string
- `JWT_SECRET` — EC private key for JWT signing
- `CORS_ORIGINS` — Allowed frontend origins

**Frontend** (`frontend/.env`):
- `VITE_API_URL` — Backend URL (leave empty in dev to use the Vite proxy)
