# Security Review

## Authentication

Firebase Authentication is initialized in `src/lib/firebase.ts`. Google sign-in is implemented in `src/App.tsx` using `GoogleAuthProvider` and `signInWithPopup`.

## Authorization

Firestore rules define:

- `isSignedIn()`
- `isAdmin()`
- `isEmployee()`

Route guards in `src/App.tsx` provide UI-level protection, but Firestore rules are the backend authority.

## Strengths

- Default-deny catch-all rule.
- Self-created profiles are constrained to `client` with false permissions.
- Client quote requests require `clientId == request.auth.uid`.
- Notifications are scoped to the current user unless admin.
- Admin-only collections are protected in rules.
- Invoice print HTML escapes interpolated values in `src/pages/Orders.tsx`.

## Risks

### Public Tracking Conflict

`src/pages/Home.tsx` queries `orders` while unauthenticated. `firestore.rules` deny public reads of `orders`.

Recommendation: create sanitized public tracking documents or require authenticated client tracking.

### Private AI Key Exposure Risk

`vite.config.ts` exposes `process.env.GEMINI_API_KEY` to the client bundle. No actual Gemini call was found, but this pattern is unsafe for private keys.

Recommendation: move AI calls behind a server function/API.

### Missing Firestore Rule Tests

No Firestore emulator tests were found.

Recommendation: implement denial tests from `security_spec.md`.

### Client-Side Financial Authority

Financial writes are initiated from browser components. Firestore rules restrict access, but business invariants still depend heavily on client code.

Recommendation: move high-trust financial mutations to a backend or add stricter rule invariants and emulator coverage.

## Other Controls

- CSRF: Not applicable in normal server-cookie form; no custom server routes were found.
- SQL injection: Not applicable; no SQL database found.
- XSS: React rendering is generally escaped. Manually generated HTML requires continued care.
- Secrets management: Firebase client config is public by design; private AI/API keys must not be shipped to browser code.
