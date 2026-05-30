# Executive Summary

Tailoring ERP is a single-page React/Vite application for a bespoke tailoring business. It implements a public storefront and order tracking surface at `/`, an authenticated client portal at `/client`, and an admin/employee ERP at `/admin/*`.

The backend is Firebase Authentication plus Cloud Firestore. No custom REST API server, queue worker, scheduler service, or backend controller layer was found in the source. Firestore Security Rules are therefore the main backend authorization boundary.

## Product Purpose

- Support bespoke quote requests from clients.
- Manage tailoring orders, production tasks, clients, measurements, appointments, inventory, vendors, payroll, accounting, notifications, branches, and employee access.
- Provide role-aware experiences for clients, employees, and admins.

## Primary Users

- Public visitors.
- Authenticated clients.
- Employees.
- Admins.

## Current Verification

The available test suite was run and passed:

```text
Test Files  11 passed (11)
Tests       40 passed (40)
```

## Main Strengths

- Broad feature coverage for tailoring ERP operations.
- Centralized role routing in `src/lib/roleRouting.ts`.
- Firestore default-deny rules in `firestore.rules`.
- Reusable realtime hook in `src/hooks/useFirestoreQuery.ts`.
- Ledger helper pattern in `src/lib/ledger.ts`.
- Offline Firestore persistence helper in `src/lib/offlinePersistence.ts`.

## Highest Risks

- Public order tracking in `src/pages/Home.tsx` queries `orders` while unauthenticated, but `firestore.rules` deny public order reads.
- No Firestore emulator denial tests were found.
- Financial authority lives in browser client code, with business invariants enforced partly by UI/helper logic.
- `vite.config.ts` injects `process.env.GEMINI_API_KEY` into client code, although no actual Gemini call was found.
- Full-collection reads in dashboard/admin modules will become costly and slow at scale.
