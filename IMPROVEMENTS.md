# Keyboard Market — Improvements & Best Practices

## Potential Features to Add

### Low Effort (wiring up existing scaffolding)
- **Edit & delete listings** — No PUT/DELETE endpoints exist yet; the model and auth are already in place.
- **Mark listing as sold** — Add a `status` field to `Listing.java` and a toggle endpoint. Filter sold items from search, show a "Sold" badge on the details page.
- **Functional favorites** — The heart icon in `ListingDetails.tsx` calls `toggleFavorite` but the function is empty. `ProfileResponse` already has `favoriteCount` — just needs a backend endpoint and a MongoDB collection.

### Medium Effort (new features on existing infrastructure)
- **Ratings & reviews** — `Profile.tsx` renders a 5-star display and review count but they're hardcoded placeholders. A `Review` document and a couple of endpoints would complete this.
- **Keyboard spec fields** — Add structured fields to `Listing.java`: switch type, layout (TKL/65%/etc.), hot-swap, keycap material. Enables spec-based filtering.
- **Multiple images** — Change `imageUrl: String` to `imageUrls: List<String>` and add an image carousel to the details page.
- **Offer system** — The `offers` boolean flag exists but there's no way to actually send an offer. Add an `Offer` model (buyer, listing, amount, status) with accept/reject endpoints.

### Larger Effort (new subsystems)
- **Image upload** — Currently only imgur URLs are accepted. Integrating Cloudinary or S3 would let sellers upload directly.
- **Chat enhancements** — Typing indicators (via WebSocket), "seen" receipts, unread message badges on the nav.
- **Email notifications** — Alert sellers when someone messages them or makes an offer (Spring Mail + template).

---

## Architectural Thoughts

### OAuth (Google/GitHub login)
**Recommendation: Worth doing.** It removes the burden of password storage and reset flows entirely, and Spring Security has first-class OAuth2 support — mostly configuration rather than new code. The main tradeoff is that users without a Google/GitHub account need a fallback, so password auth would stay alongside OAuth rather than be replaced. Spring Security handles this cleanly with a provider chain.

---

## Best Practices & Code Issues

### Security

- **Chat endpoints have no authorization checks** — [`ChatController.java`](backend/src/main/java/com/keyboardmarket/controller/ChatController.java) — any authenticated user can fetch chat history for any `userId` pair. Fix: add `@PreAuthorize("#userId == authentication.name")`.
- **Controllers return raw entity objects** — [`UserController.java`](backend/src/main/java/com/keyboardmarket/controller/UserController.java) returns `User` documents including password hashes. Create DTOs and never return raw model objects from endpoints.
- **ReDoS vulnerability** — [`ListingService.java`](backend/src/main/java/com/keyboardmarket/service/ListingService.java) passes raw user input into `.regex(filter.getTitle(), "i")`. Wrap with `Pattern.quote()` to escape malicious patterns.
- **No pagination cap** — [`ListingController.java`](backend/src/main/java/com/keyboardmarket/controller/ListingController.java) accepts `size` with no upper bound. Add `@Max(100)` to the parameter.

### Error Handling

- **`catch (error: any)` everywhere** — [`Login.tsx`](frontend/src/pages/Login.tsx), [`CreateListing.tsx`](frontend/src/pages/CreateListing.tsx), and others use untyped catch blocks. Use `AxiosError<{error: string}>` for proper narrowing.
- **`GlobalExceptionHandler` swallows stack traces** — the generic `RuntimeException` handler returns a bad request with no logging. Exceptions should be logged before responding.
- **`AuthProvider` silently eats all errors** — [`AuthProvider.tsx`](frontend/src/utils/AuthProvider.tsx) — a network failure and a 401 look identical, making it impossible to distinguish a broken auth flow from a downed backend.

### React Anti-patterns

- **Missing `useEffect` cleanup in Chat** — [`Chat.tsx`](frontend/src/components/Chat.tsx) — WebSocket subscriptions and drag event listeners may not clean up on unmount, causing memory leaks and stale state.
- **Intersection Observer recreated on every fetch** — [`Listings.tsx`](frontend/src/pages/Listings.tsx) includes `page` in the dependency array of `lastListingElementRef`, which changes every time data loads. Remove `page` from the deps.
- **No loading state on form submit** — [`Login.tsx`](frontend/src/pages/Login.tsx), [`CreateListing.tsx`](frontend/src/pages/CreateListing.tsx) — the submit button stays enabled during the request, allowing double-submission.
- **`Promise.all` without error isolation** — [`Profile.tsx`](frontend/src/pages/Profile.tsx) — if either the user or listings request fails, both fail silently, leaving the page in a broken partial state.

### API Design

- **No input validation on chat messages** — [`ChatController.java`](backend/src/main/java/com/keyboardmarket/controller/ChatController.java) accepts `ChatMessage` with no `@Valid` annotation or length constraints.
- **Inconsistent API URL usage** — [`CreateListing.tsx`](frontend/src/pages/CreateListing.tsx) posts to `/api/listings` (relative) while other files use `${API_URL}`. In production this would hit the wrong host.
- **No axios timeout configured** — all requests can hang indefinitely. Set `axios.defaults.timeout = 10000` in the service config.

### Code Organization

- **Query-building logic in the service layer** — [`ListingService.java`](backend/src/main/java/com/keyboardmarket/service/ListingService.java) builds `MongoTemplate` queries inline. This belongs in a custom repository implementation, keeping the service focused on business logic.
- **`console.error` calls in production paths** — [`Listings.tsx`](frontend/src/pages/Listings.tsx), [`Chat.tsx`](frontend/src/components/Chat.tsx), [`websocketService.ts`](frontend/src/services/websocketService.ts), and others. Replace with a proper logger or remove entirely.

---

## Priority Order

| Priority | Item |
|----------|------|
| 1 | Auth checks on chat endpoints — actual security hole |
| 2 | DTOs instead of raw entities — stop leaking internals |
| 3 | Typed error handling — fragile `any` catches hide real bugs |
| 4 | `useEffect` cleanup in Chat — memory leak on a heavily-used component |
| 5 | Axios timeout — one slow request can lock the UI indefinitely |
| 6 | OAuth login — most worthwhile architectural addition |
| 7 | Edit/delete listings + mark as sold — missing core marketplace functionality |
| 8 | Ratings & reviews — scaffolding already exists, just needs wiring |
