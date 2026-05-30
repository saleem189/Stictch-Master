# Improvement Roadmap

## Phase 1: Security and Trust Boundaries

- Implement sanitized public order tracking or require authenticated tracking.
- Remove private AI key exposure from browser bundle.
- Add Firestore emulator tests for `security_spec.md`.
- Tighten Firestore allowed keys and string size limits.

## Phase 2: Financial Integrity

- Add idempotency to payroll and recurring transaction processing.
- Use deterministic payroll document IDs by employee and month.
- Move high-trust financial mutations to backend services where feasible.
- Add transaction-level tests for order payment, payroll, and vendor bill flows.

## Phase 3: Scale and Performance

- Add pagination to large admin tables.
- Add dashboard aggregate documents.
- Add Firestore index definitions.
- Add route-level lazy loading.

## Phase 4: Quality and Maintainability

- Extract large component Firestore workflows into service/helper modules.
- Add component tests for `NewOrderForm`, `PaymentModal`, `QuoteRequests`, `Profile`, and `NotificationBell`.
- Add authenticated workflow tests.
- Complete i18n coverage for user-visible strings.

## Phase 5: Operations

- Add CI for test, lint, type check, and build.
- Add Firebase deployment documentation.
- Add monitoring/error reporting.
- Define backup, restore, and incident-response runbooks.
