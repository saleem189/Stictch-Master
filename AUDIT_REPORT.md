# StitchMaster ERP Production Audit

Date: 2026-05-16

## Latest Application Update

The application now includes a role-aware client portal and Tailoring ERP brand asset integration.

- Public visitors use `/` as the storefront.
- Clients route to `/client` after login.
- Admins and employees route to `/admin` after login.
- Clients can submit bespoke inquiries through `/client/request-quote`.
- Quote inquiries are stored in `quoteRequests` and are documented in `firebase-blueprint.json`.
- Firestore rules include client-owned quote request boundaries.
- The downloaded logo asset lives at `src/assets/stitchmaster-logo.png` and is rendered through `src/components/BrandLogo.tsx`.

Remaining product gaps:

- Staff quote review and quote-to-order conversion are not implemented yet.
- Public order tracking still needs sanitized tracking documents or authenticated client-only tracking.
- Financial multi-document writes still need transaction/batch hardening.
- The production bundle still needs route-level code splitting.

## Executive Summary

StitchMaster has a strong product direction: a bilingual tailoring ERP covering clients, orders, production tasks, inventory, payroll, accounting, vendors, branches, and public order tracking. The UI is already broad and visually coherent, and the app now passes lint, TypeScript, unit tests, and production build after the first remediation pass.

The application is closer to production-ready, but not fully there yet. The most dangerous authorization bug was fixed: new Google users are no longer auto-provisioned as admins, and self-created profiles are constrained to safe client permissions. The remaining major risks are financial write consistency, public tracking design, missing Firestore emulator tests, production API key handling, and scale/performance work.

## Scope

Reviewed:

- Documentation: `README.md`, `TECHNICAL_SPEC.md`, `security_spec.md`, `AGENTS.md`, `GEMINI.md`
- Firebase/Auth: `src/lib/firebase.ts`, `src/contexts/UserContext.tsx`, `firestore.rules`
- Core pages: `Home`, `Dashboard`, `Orders`, `Clients`, `Inventory`, `Vendors`, `Accounting`, `Employees`, `Appointments`, `Branches`, `Profile`
- Critical modals: order, payment, payroll, vendor bill, roll management, financial document, recurring transaction
- Tooling: `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.mjs`
- Quality gates: tests, build, lint, TypeScript check, browser smoke test

Not fully covered yet:

- Firebase emulator rule execution
- Authenticated Google login flow with real test accounts
- Cross-browser visual QA
- Full accessibility audit with axe
- Real production Firestore indexes and deployed rules

## Quality Gate Results

| Gate | Result | Notes |
|---|---:|---|
| `npm test` | Pass | 2 files, 8 tests |
| `npm run build` | Pass | Large bundle and chunking warnings remain |
| Browser smoke test | Partial pass | Homepage renders; tracking interaction hits Firebase permission error |
| `npm run lint` | Pass | Runs ESLint and `tsc --noEmit` |
| `npm exec tsc -- --noEmit` | Pass | Covered by `npm run lint` |

## Remediation Completed In This Pass

- Removed new-user admin auto-provisioning in `src/contexts/UserContext.tsx`; new self-created profiles default to `client` with all permissions false.
- Tightened `/users/{userId}` Firestore create rules so self-signup cannot grant admin or privileged permissions.
- Removed the hardcoded admin email bypass from `firestore.rules`.
- Added missing `profileRequests` rules and tightened notification, inventory, financial document, and order update validation.
- Added `taskStatus` to the `Order` model and made public tracking render safely when task status is absent.
- Fixed the tracking lifecycle mismatch by using `ready` instead of a nonexistent `finished` status.
- Escaped invoice print HTML fields before writing them to the print window.
- Normalized order finance calculations in `src/lib/orderFinance.ts` and reused them in order creation/payment flow.
- Fixed domain type drift for branches, audit trail entries, fabric rolls, inventory logs, employees, and financial transactions.
- Removed the previous TypeScript and ESLint baseline failures, including unused imports/state and unsafe `any` usage in reviewed files.
- Added a Vitest setup and unit tests for validation and order finance logic.

## Critical Findings

### C1: New users can become admins - Fixed

Evidence:

- `src/contexts/UserContext.tsx:32`
- `src/contexts/UserContext.tsx:37`
- `firestore.rules:37`
- `security_spec.md:10`

When a signed-in Google user has no profile, the client creates one with `role: 'admin'`. Firestore rules also permit a signed-in user to create their own `/users/{uid}` document if it passes `isValidUser`, and `isValidUser` allows `admin`.

Impact:

- Any authenticated user can potentially gain admin privileges.
- Admin-only UI and Firestore rules become unreliable.
- This directly violates the documented "Privilege Escalation" denial test.

Fix:

- Client-side admin auto-provisioning was removed.
- New self-created users now default to `client` with all permissions false.
- Firestore self-create rules now require the safe client shape.
- Follow-up: move admin grants to custom claims or a backend-only admin workflow.

### C2: Hardcoded admin email bypass exists in rules - Fixed

Evidence:

- `firestore.rules:15`

The rules grant admin if `request.auth.token.email == 'saleemayoub1@gmail.com'`.

Impact:

- Breaks least-privilege and auditable RBAC.
- If that account is compromised, rules permanently trust it.
- Makes environment-specific admin control hard to manage.

Fix:

- Hardcoded email bypass was removed from rules.
- Follow-up: use custom claims managed by a secure backend, or an admin-controlled role document with locked writes.

## High Findings

### H1: Public order tracking conflicts with Firestore rules

Evidence:

- `src/pages/Home.tsx:24`
- `firestore.rules:79`
- Browser smoke test: `FirebaseError: Missing or insufficient permissions`

The public homepage queries the `orders` collection by document ID while unauthenticated. Firestore requires signed-in access for order reads. The current user experience is a generic error.

Impact:

- Public tracking feature does not work.
- If rules are loosened directly on `orders`, customer/payment data could leak.

Fix:

- Create a limited `publicOrderTracking/{trackingCode}` document with sanitized status fields.
- Or require client auth and map authenticated clients to their orders.
- Add tests for unauthenticated tracking behavior.

### H2: Tracking page can crash if an order is returned - Fixed

Evidence:

- `src/pages/Home.tsx:237`
- `src/pages/Home.tsx:239`
- `src/types.ts:83`
- `src/pages/Employees.tsx:124`

`Home` reads `orderStatus.taskStatus.cutting`, but `Order` does not define `taskStatus`. `Employees` writes `taskStatus.*` to orders, so the runtime shape has drifted from TypeScript and the order creation flow.

Impact:

- Successful public tracking can throw at render time when `taskStatus` is absent.
- Type model no longer describes actual persisted data.

Fix:

- `taskStatus` was added to `Order`.
- `Home` now uses optional chaining and the valid `ready` status.
- Firestore order update rules now allow `taskStatus`.

### H3: Payment and accounting updates are non-atomic

Evidence:

- `src/components/PaymentModal.tsx:28`
- `src/components/PaymentModal.tsx:33`
- `src/components/PaymentModal.tsx:44`
- `src/components/OrderDetailsModal.tsx:84`
- `src/components/OrderDetailsModal.tsx:93`
- `src/pages/Employees.tsx:70`
- `src/components/PayrollModal.tsx:76`
- `src/lib/automation.ts:33`

Financial flows update orders, payments, transactions, payroll records, and account balances through separate writes. Some flows use `writeBatch` elsewhere (`VendorBillModal`, `RollManagementModal`), but core payment/payroll/automation flows do not.

Impact:

- Partial failure can leave an order paid without a payment record, a transaction without balanced accounts, or payroll without a ledger trail.
- Re-running operations can duplicate transactions.

Fix:

- Use `runTransaction` or `writeBatch` for each financial unit of work.
- Validate account existence before writes.
- Include idempotency keys or deterministic references for recurring/payroll actions.

### H4: Firestore rules validate shapes too loosely for financial and inventory data - Partially Fixed

Evidence:

- `firestore.rules:100`
- `firestore.rules:131`
- `firestore.rules:137`
- `firestore.rules:196`

Examples:

- Inventory writes only require `name` and numeric `quantity`, but do not prevent negative quantity.
- Financial documents require a non-negative amount but not linkage to `orderId`, `clientId`, or `employeeId`.
- Any signed-in user can create notifications for any `userId`.

Impact:

- Business invariants from `security_spec.md` are not enforced.
- Malicious or buggy clients can create misleading documents/notifications.

Fix:

- Added checks for non-negative inventory quantities.
- Added stronger financial document linkage checks.
- Restricted notification creation to the target user or admin.
- Follow-up: add emulator tests and continue tightening allowed keys and string limits.

### H5: Print invoice HTML is built with unsanitized interpolated data - Fixed

Evidence:

- `src/pages/Orders.tsx:45`
- `src/pages/Orders.tsx:133`

`printInvoice` writes an HTML string containing order/client/item fields into a new window via `document.write`.

Impact:

- If a client name or item description contains HTML/script-like content, it can execute or corrupt printed output.

Fix:

- Interpolated invoice fields are now escaped before the print document is written.
- Follow-up: consider replacing `document.write` with a dedicated React print component for maintainability.

## Medium Findings

### M1: TypeScript baseline fails - Fixed

Command:

- `npm exec tsc -- --noEmit`

Representative errors:

- `src/contexts/UserContext.tsx:38`: permissions object missing required fields
- `src/components/NewOrderForm.tsx:90`: object audit entry assigned to `auditTrail: string[]`
- `src/components/RollManagementModal.tsx:250`: missing `Tag` import
- `src/pages/Appointments.tsx:45`: `setLoading` is undefined
- `src/pages/Branches.tsx:66`: UI uses `address`, `email`, `manager`, `isActive`, but `Branch` only defines `name`, `location`, `phone`, `managerId`
- `src/types.ts:202`: `FinancialTransaction` incorrectly extends `Transaction`

Impact:

- Build succeeds because Vite transpiles, but type errors hide real runtime/model bugs.

Fix:

- Type drift was fixed until `npm run lint` passes.
- Follow-up: enable stricter TypeScript settings progressively.

### M2: ESLint baseline fails - Fixed

Command:

- `npm run lint`

Result:

- 35 errors, mostly unused variables/imports and explicit `any`.

Impact:

- CI cannot reliably enforce new quality.
- Existing errors normalize unsafe typing.

Fix:

- Cleaned unused imports/state from the audited files.
- Replaced shared `any` usage with typed domain structures in the touched flows.

### M3: Documentation and implementation disagree on order lifecycle

Evidence:

- `TECHNICAL_SPEC.md:22`
- `AGENTS.md:33`
- `src/types.ts:63`
- `src/types.ts:78`

Docs describe both a detailed pipeline (`measurement`, `pattern-making`, `cutting`, etc.) and a simplified global flow (`pending`, `in-progress`, `ready`, `delivered`). The implementation mixes global order status, item status, task status, and an undefined `finished` state.

Impact:

- UI, rules, and analytics can disagree about what "done" means.

Fix:

- Define one canonical workflow model.
- Add transition guards and tests for allowed status movement.

### M4: Bilingual/i18n standard is not consistently followed

Evidence:

- `AGENTS.md:18`
- `src/components/NewOrderForm.tsx:159`
- `src/components/PaymentModal.tsx:73`
- `src/components/VendorModal.tsx:68`
- `src/pages/Home.tsx`

Many user-facing strings are hardcoded instead of using `t()`.

Impact:

- Urdu/RTL support is incomplete and hard to maintain.

Fix:

- Move user-visible strings into `src/lib/i18n.ts`.
- Add test/lint coverage for newly added hardcoded strings later.

### M5: Gemini API key is exposed to the browser build

Evidence:

- `vite.config.ts:12`
- `GEMINI.md:22`

The config defines `process.env.GEMINI_API_KEY` for client code. Any frontend-side AI call would expose the API key in the JavaScript bundle.

Impact:

- API key theft and unbounded usage.

Fix:

- Move AI calls behind a server/API function.
- Do not inject private API keys into Vite client bundles.

### M6: Dashboard and admin pages fetch entire collections

Evidence:

- `src/pages/Dashboard.tsx:103`
- `src/pages/Employees.tsx:32`
- `src/pages/Vendors.tsx:38`
- `src/pages/Orders.tsx:28`

Several pages load whole collections, then aggregate/filter on the client.

Impact:

- Slow at scale.
- Increased Firestore read costs.
- More sensitive data loaded into the browser than necessary.

Fix:

- Add scoped queries, pagination, and server-side aggregates where needed.
- Use Firestore count/aggregate queries or precomputed stats.

### M7: Bulk payroll can double-pay

Evidence:

- `src/pages/Employees.tsx:54`
- `src/pages/Employees.tsx:70`
- `src/pages/Employees.tsx:87`

Bulk payroll loops over all employees and creates new transactions/payroll records without checking whether that month has already been paid.

Impact:

- Duplicate salary payouts and ledger entries.

Fix:

- Use deterministic payroll IDs per employee/month.
- Check existing records inside a transaction.
- Disable payout for already-paid records.

### M8: Seeder is available from the production admin dashboard

Evidence:

- `src/pages/Dashboard.tsx:259`
- `src/lib/seeder.ts`

The dashboard exposes a "Seed Data" action that writes sample branches, accounts, employees, clients, orders, and transactions.

Impact:

- Accidental sample data pollution in a real production database.

Fix:

- Hide behind dev-only environment flag.
- Require explicit emulator/dev project detection.

### M9: Profile request collection is missing Firestore rules - Fixed

Evidence:

- `src/pages/Profile.tsx:68`
- `src/pages/Profile.tsx:104`
- `firestore.rules`

The app uses `profileRequests`, but no matching rule exists. Default deny applies.

Impact:

- Employee profile change requests will fail unless rules are changed outside this repo.

Fix:

- Added rules for create/read/update by owner/admin.
- Follow-up: add emulator tests.

## Low Findings

### L1: App metadata still says "My Google AI Studio App"

Evidence:

- Browser title during smoke test

Impact:

- Brand inconsistency.

Fix:

- Update `index.html` title and metadata.

### L2: Package metadata is generic

Evidence:

- `package.json:2`

`name` is `react-example`.

Fix:

- Rename to `stitchmaster-erp` or similar.

## Tests Added During Audit

Added a basic industry-standard test foundation:

- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `jsdom`
- `src/test/setup.ts`
- `src/lib/validation.test.ts`
- `src/lib/orderFinance.test.ts`
- `src/lib/orderFinance.ts`

Covered:

- form validation success/errors
- optional email/phone validators
- minimum numeric validator
- order total calculation
- negative/invalid price normalization
- remaining balance never going negative
- payment settlement changing status to `delivered`

These tests are intentionally small and stable. The next layer should be emulator security tests and component tests.

## Prioritized Remediation Plan

1. Add Firestore emulator tests for the Dirty Dozen security cases.
2. Fix public tracking design: authenticated client view or sanitized public tracking docs.
3. Convert payment/payroll/recurring financial writes to transactions/batches.
4. Move Gemini/API-key usage server-side only.
5. Add component tests for `NewOrderForm`, `PaymentModal`, `Home` tracking states, and RBAC navigation.
6. Add pagination/aggregation and route-level lazy loading for performance.
7. Continue tightening Firestore allowed keys, string lengths, and cross-document invariants.
8. Add accessibility and real authenticated workflow QA.

## Reusable Audit Prompt

```text
Audit this application like a senior production engineer.

First read the project docs and summarize the intended product, data model, security model, and core workflows. Then verify those claims against the actual code; do not assume the docs are correct.

Review:
- architecture and module boundaries
- authentication and authorization
- Firestore rules and data access
- business logic and accounting consistency
- forms, validation, loading, and error states
- TypeScript, linting, build, and dependency health
- accessibility, i18n, responsiveness, and performance
- missing tests and high-risk untested flows

After the audit, add meaningful tests following industry standards. Prioritize security-sensitive behavior, business rules, forms, error/loading states, routing, and data integrity. Avoid shallow snapshot-only tests.

Return:
1. Findings ordered by severity with file references
2. What the docs claimed vs what the code actually does
3. Tests added or changed
4. Commands run and exact results
5. Remaining risks and next testing priorities

Do not make broad refactors unless required to fix a real issue or make important behavior testable.
```
