# Keyboard Market — Improvements & Best Practices

## Potential Features to Add

### Low Effort (wiring up existing scaffolding)
- **Edit & delete listings** — No PUT/DELETE endpoints exist yet; the model and auth are already in place.
- **Mark listing as sold** — Add a `status` field to the listing schema and a toggle endpoint. Filter sold items from search, show a "Sold" badge on the details page.
- **Functional favorites** — The heart icon in `ListingDetails.tsx` calls `toggleFavorite` but the function is empty. `ProfileResponse` already has `favoriteCount` — just needs a backend endpoint and a MongoDB collection.

### Medium Effort (new features on existing infrastructure)
- **Ratings & reviews** — `Profile.tsx` renders a 5-star display and review count but they're hardcoded placeholders. A `Review` document and a couple of endpoints would complete this.
- **Keyboard spec fields** — Add structured fields to the listing schema: switch type, layout (TKL/65%/etc.), hot-swap, keycap material. Enables spec-based filtering.
- **Multiple images** — Change `imageUrl: String` to `imageUrls: [String]` and add an image carousel to the details page.
- **Offer system** — The `offers` boolean flag exists but there's no way to actually send an offer. Add an `Offer` schema (buyer, listing, amount, status) with accept/reject endpoints.

### Larger Effort (new subsystems)
- **Image upload** — Currently only Imgur URLs are accepted. Integrating Cloudinary or S3 would let sellers upload directly.
- **Chat enhancements** — Typing indicators (via Socket.io), "seen" receipts, unread message badges on the nav.
- **Email notifications** — Alert sellers when someone messages them or makes an offer (Nodemailer + template).

---

## Architectural Thoughts

### OAuth (Google/GitHub login)
**Recommendation: Worth doing.** It removes the burden of password storage and reset flows entirely, and Passport.js has first-class OAuth2 strategies for NestJS — mostly configuration rather than new code. The main tradeoff is that users without a Google/GitHub account need a fallback, so password auth would stay alongside OAuth rather than be replaced.

### Chat data model — introduce a `Conversation` entity
**Current design:** `ChatMessage` is a flat collection filtered by `senderId`/`receiverId`. Listing conversations requires the aggregation pipeline in [backend/src/chat/chat.service.ts](backend/src/chat/chat.service.ts). This works but becomes painful as features grow.

**Recommended design:**
```typescript
// Conversation: { id, participantIds: [string, string], listingId, lastMessageAt, lastMessagePreview, unreadCounts: Record<userId, number> }
// ChatMessage:  { id, conversationId, senderId, content, timestamp, read }
```
With a `Conversation` document the inbox query becomes a single indexed lookup instead of an aggregation. It also enables unread badges, typing indicators, muting, and "this chat is about [listing]" context — all of which require a conversation-level record.

### MongoDB vs relational
The data model is straightforwardly relational (users own listings, messages reference two users). PostgreSQL would express the conversation queries as a simple `GROUP BY` with `JOIN`. MongoDB is not wrong here and isn't worth swapping out now, but keep this in mind if the query complexity grows — the aggregation pipeline needed for conversations is the clearest sign of the mismatch.

---

## Best Practices & Code Issues

### Security

- **WebSocket gateway has no authentication** — [backend/src/chat/chat.gateway.ts](backend/src/chat/chat.gateway.ts) — any client can connect claiming any `userId` via the handshake query string, then receive messages intended for that user. Fix: validate the JWT cookie in `handleConnection` and verify the claimed `userId` matches the token's `sub`.
- **User endpoints expose password hashes** — [backend/src/users/users.controller.ts](backend/src/users/users.controller.ts) — `getByUsername`, `getByEmail`, and `getById` return raw `User` documents; the `User` schema has no `select: false` on `password`. Create response DTOs or add `@Exclude()` via class-transformer.
- **ReDoS vulnerability** — [backend/src/listings/listings.service.ts:35,59](backend/src/listings/listings.service.ts) passes raw user input directly into `{ $regex: title, $options: 'i' }`. Wrap with an `escapeRegExp` helper to escape metacharacters.
- **No pagination cap** — [backend/src/listings/dto/listing-filter.dto.ts](backend/src/listings/dto/listing-filter.dto.ts) accepts `size` with no upper bound. Add `@Max(100)` (class-validator) to `size`.

### Error Handling

- **`AllExceptionsFilter` swallows stack traces** — [backend/src/common/filters/http-exception.filter.ts](backend/src/common/filters/http-exception.filter.ts) — non-`HttpException` errors return a 500 with no logging. Add a `Logger` call before responding so server-side errors are visible.
- **Untyped catch blocks** — [frontend/src/components/Chat.tsx:78](frontend/src/components/Chat.tsx) and [frontend/src/utils/AuthProvider.tsx:36](frontend/src/utils/AuthProvider.tsx) use untyped `catch (error)` / `(err: any)`. Use `AxiosError<{error: string}>` for proper narrowing.

### React Anti-patterns

- **No loading state on form submit** — [frontend/src/pages/Login.tsx](frontend/src/pages/Login.tsx) and [frontend/src/pages/CreateListing.tsx](frontend/src/pages/CreateListing.tsx) — the submit button stays enabled during the request, allowing double-submission.

### Database & Data Model

- **N+1 query in `getUserConversations`** — [backend/src/chat/chat.service.ts:47](backend/src/chat/chat.service.ts) — calls `usersService.findById()` inside a `Promise.all` map, one DB round-trip per conversation. Fix: collect all partner IDs first, call `userModel.find({ _id: { $in: ids } })` once, build a lookup map.
- **`price` stored as `Number`** — [backend/src/listings/schemas/listing.schema.ts:15](backend/src/listings/schemas/listing.schema.ts) — floating-point arithmetic is wrong for money. Store as an integer (cents, e.g. `$49.99` → `4999`) or use MongoDB's `Decimal128`.
- **`condition` is a free string** — [backend/src/listings/schemas/listing.schema.ts:21](backend/src/listings/schemas/listing.schema.ts) — no enforcement of valid values. Replace with an enum (`NEW`, `LIKE_NEW`, `USED`, `FOR_PARTS`) and validate via class-validator on the DTO.
- **`ChatMessage` missing `listingId`** — [backend/src/chat/schemas/chat-message.schema.ts](backend/src/chat/schemas/chat-message.schema.ts) — for a marketplace, conversations almost always refer to a specific listing. Without this field you can't show which listing is being discussed or scope history to a listing.
- **Text index unused** — [backend/src/listings/schemas/listing.schema.ts:33](backend/src/listings/schemas/listing.schema.ts) already defines a MongoDB text index on `title`, but [backend/src/listings/listings.service.ts:35,59](backend/src/listings/listings.service.ts) still uses `$regex` instead of `{ $text: { $search: title } }`, so the index never kicks in.

### API Design

- **No input validation on WebSocket messages** — [backend/src/chat/chat.gateway.ts](backend/src/chat/chat.gateway.ts) — the `chat.send` handler receives `SendMessageDto` with no validation pipe, so content length is unconstrained. Add `@UsePipes(ValidationPipe)` and a `@MaxLength` on `content`.
- **No axios timeout configured** — [frontend/src/utils/api.ts](frontend/src/utils/api.ts) — all requests can hang indefinitely. Set a `timeout` on the axios instance.

### Code Organization

- **`console.error` calls in production paths** — [frontend/src/components/Chat.tsx](frontend/src/components/Chat.tsx) and [frontend/src/services/websocketService.ts](frontend/src/services/websocketService.ts). Replace with a proper logger or remove entirely.

---

## Priority Order

| Priority | Item |
|----------|------|
| 1 | WebSocket gateway authentication — unauthenticated connections can impersonate any user |
| 2 | User endpoints expose password hashes — stop leaking credentials |
| 3 | Fix N+1 in `getUserConversations` — live performance issue |
| 4 | Fix `price` to integer (cents) — silent money math bugs |
| 5 | Use text index for title search — index exists but is never hit |
| 6 | No loading state on form submit — allows double-submission |
| 7 | Axios timeout — one slow request can lock the UI indefinitely |
| 8 | Add `listingId` to `ChatMessage` — product gap, easy now, painful later |
| 9 | `condition` enum — data integrity, bad values can be stored silently |
| 10 | Introduce `Conversation` entity — bigger refactor, unlocks unread counts, typing indicators, listing context |
| 11 | OAuth login — most worthwhile architectural addition |
| 12 | Edit/delete listings + mark as sold — missing core marketplace functionality |
| 13 | Ratings & reviews — scaffolding already exists, just needs wiring |
