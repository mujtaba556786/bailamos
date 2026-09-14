# Booking reliability — implementation checkpoint

Implemented: strict booking validation; Berlin service hours with a two-hour seating duration; database interval exclusion including legacy records; idempotent submission; active duplicate detection; hashed cancellation tokens for new bookings; guarded owner transitions and optimistic version checks; atomic status history; durable newsletter intent without overwriting unsubscribe status.

The guest form now queries availability before table selection, retains detail fields when navigating back, handles failed connections, and supports cancellation from the confirmation screen. Availability is advisory until submission; the database is authoritative.

## Verification

`scripts/test-bookings.mjs` runs 16 regression checks against an isolated Miniflare D1 database with all migrations. Includes simultaneous bookings/retries, adjacent intervals, cancellation/rebooking, direct database reactivation, stale owner updates, audit events, invalid inputs, DST, newsletter preservation/failure, legacy conflicts and recovery after SQL failure. TypeScript and production build also pass.

## Configuration to confirm with the owner

- Current configured tables each seat four. Larger parties cannot book online until a real group/table-combination policy exists.
- Defaults introduced: 30-minute lead time and 180-day booking horizon.
- Opening hours and duration come from data/restaurant.json and must match actual operations.

## Deployment and API compatibility

- Migration 0004 is additive. It contains custom SQLite triggers not represented by Drizzle schema generation; preserve and test them in future migrations.
- Deploy the migration before new API code. Existing owner clients must send the current numeric `version` from GET in each PATCH, and a reason for cancellation/decline.
- POST /api/reservations requires an Idempotency-Key header (random UUID per payload). Repeat the same key and payload after a connection failure. Returns reservation, replayed, cancellationToken; never log the token.
- POST /api/reservations/cancel requires id and cancellation token. Legacy raw tokens remain supported; new stored tokens are hashed.
- Local preview migration applied. Production deployment is not performed in this checkpoint.

## Still required

- Full browser/mobile end-to-end QA, including focus/error placement.
- Connect the owner interface to live API data and version-aware actions; production authentication, rate limiting and operational monitoring.
- Verified email provider, durable outbox and delivery retries so the new customer management link is delivered automatically.
- Newsletter double opt-in, unsubscribe workflow and retry worker for reservations where newsletter_opt_in=1 and newsletter_synced_at IS NULL. No marketing emails are sent.
- Persistent retry recovery after page reload; current retry keys survive only within the open form.
- Review existing production overlaps before deployment. New triggers prevent new conflicts but do not repair pre-existing duplicate records.

Next product phase: simplify booking UX while preserving the existing visual brand and consistent header, then implement the live owner workflow.
