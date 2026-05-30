# Technical Debt Report

## Strengths

- Broad functional coverage for the tailoring domain.
- Firestore rules use default deny.
- Role routing is centralized.
- Realtime query wrapper is reusable.
- Ledger helper consolidates double-entry writes.
- Tests cover several pure business helpers.
- Offline persistence is handled gracefully.

## Weaknesses

### Critical

- Public order tracking is not aligned with Firestore authorization.
- Private AI key injection pattern exists in Vite config.
- Firestore rules have no emulator test coverage.

### High

- Payroll and recurring transactions lack idempotency safeguards.
- Financial writes run from browser clients.
- Dashboard/admin modules read large collections.
- No backend scheduler for recurring transactions.

### Medium

- Route-level code splitting not found.
- Component and integration tests not found.
- i18n is inconsistent; many user-facing strings are hardcoded.
- Permission flags and Firestore role rules are not fully aligned.

### Low

- `package.json` name is `react-example`.
- Some docs are stale relative to current code.
- Monitoring and deployment docs are missing.

## Recommendations

Critical:

- Build sanitized public tracking collection or require authenticated tracking.
- Remove client-side private key injection before AI features are enabled.
- Add Firestore emulator tests for the dirty dozen security cases.

High:

- Add deterministic payroll IDs and duplicate-period checks.
- Move recurring transaction execution to backend scheduler.
- Add pagination and aggregate documents.

Medium:

- Extract Firestore workflows into testable service modules.
- Add component tests for high-risk modals.
- Add route-level lazy loading.
- Finish i18n migration.

Low:

- Clean package metadata.
- Add deployment and incident runbooks.
