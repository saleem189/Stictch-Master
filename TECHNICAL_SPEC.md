# Tailoring ERP Technical Specification

This document describes the current architecture and operational flows of Tailoring ERP.

## 1. System Architecture

Tailoring ERP is a Vite React application backed by Firebase Auth and Cloud Firestore. It supports a public storefront, a client portal, and an admin/employee ERP dashboard.

### Frontend

- React 19 with Vite
- Tailwind CSS v4
- Motion for state-driven page/modal transitions
- Lucide React icons
- Recharts for dashboard visualization
- i18next and react-i18next for English/Urdu support

### Backend

- Firebase Authentication with Google provider
- Cloud Firestore for operational data
- Firestore multi-tab IndexedDB persistence for browser offline cache support
- Firestore Security Rules in `firestore.rules`
- Collection shape documented in `firebase-blueprint.json`

### Branding

- Logo asset: `src/assets/stitchmaster-logo.png`
- Reusable brand component: `src/components/BrandLogo.tsx`
- Display brand: Tailoring ERP

## 2. Route Map

- `/`: public storefront and tracking entry point
- `/login`: shared login screen
- `/client`: authenticated client dashboard
- `/client/request-quote`: client bespoke quote request form
- `/admin/*`: admin and employee ERP shell

Role routing is centralized in `src/lib/roleRouting.ts`:

- `admin` -> `/admin`
- `employee` -> `/admin`
- `client` -> `/client`
- missing/unknown role -> `/`

If an unauthenticated visitor opens a client route, the app redirects to `/login` and returns a client user to the requested client route after login.

## 3. Core Operational Flows

### 3.1 Public Storefront

The homepage introduces the tailoring business, shows client-facing calls to action, and exposes order tracking. The primary public CTA is now `Request Bespoke Quote`, which routes through authentication into the client quote flow.

### 3.2 Client Quote Request

Clients submit bespoke inquiries through `/client/request-quote`.

Required fields:

- garment type
- style notes
- preferred due date
- budget range
- measurement source

The form creates a `quoteRequests` document with `status: submitted`. It does not create an order, payment, transaction, or financial document. Staff conversion from quote to order is a future workflow.

### 3.3 Client Dashboard

The client dashboard reads:

- `orders` where `clientId == auth.uid`
- `quoteRequests` where `clientId == auth.uid`

It uses realtime Firestore listeners, shows order status, quote request status, payment summary, cache/sync indicators, and a measurements placeholder.

### 3.4 Admin/Employee Dashboard

Admins and employees use `/admin/*` for operations:

- dashboard analytics
- orders
- clients
- appointments
- inventory
- profile

Admins additionally access:

- vendors
- accounting
- employees
- branches

### 3.5 Notifications and Offline State

Notifications are normalized through `src/lib/notifications.ts` before they are written or displayed. The notification bell listens live to the signed-in user's notification stream, displays listener errors, marks individual notifications as read, and supports clearing unread notifications in a batch.

Firestore persistence is initialized from `src/lib/firebase.ts` through `src/lib/offlinePersistence.ts`. The app reports offline cache and pending-write states in realtime-enabled surfaces. Full PWA app-shell caching and background delivery are still future work.

### 3.6 Order Lifecycle

Global order status:

- `pending`
- `in-progress`
- `ready`
- `delivered`
- `cancelled`

Item workflow status supports a more granular bespoke production pipeline:

- `measurement`
- `fabric-reservation`
- `pattern-making`
- `cutting`
- `stitching`
- `trial`
- `fitting`
- `alterations`
- `finishing`
- `quality-check`
- `ready`
- `delivered`
- `archived`

Orders include an embedded `auditTrail` array and optional `taskStatus` sync state.

### 3.7 Accounting

Financial records use double-entry fields:

- `debitAccountId`
- `creditAccountId`

Payments, payroll, purchases, and recurring entries should keep orders, payments, transactions, documents, and account balances synchronized. Some flows still need transactional hardening; see `AUDIT_REPORT.md`.

## 4. Data Model Highlights

Central TypeScript interfaces live in `src/types.ts`.

Recent important types:

- `QuoteRequest`
- `QuoteRequestStatus`
- `MeasurementSource`
- `OrderTaskStatus`
- `AuditTrailEntry`

Pure helper modules:

- `src/lib/roleRouting.ts`
- `src/lib/quoteRequests.ts`
- `src/lib/orderFinance.ts`
- `src/lib/notifications.ts`
- `src/lib/offlinePersistence.ts`
- `src/lib/validation.ts`

Realtime hooks:

- `src/hooks/useFirestoreQuery.ts`

## 5. Firestore Security Model

Rules are role-based:

- Self-created users are restricted to safe `client` profiles.
- Admin and employee permissions derive from `/users/{uid}.role`.
- Clients can create and read their own quote requests.
- Employees/admins can read quote requests and update review status.
- Notifications must match the normalized schema and can only be created for the signed-in user unless the creator is an admin.
- Admin-only collections remain restricted by `isAdmin()`.

## 6. Testing and Verification

Current unit coverage includes:

- validation helpers
- order finance helpers
- role routing helpers
- quote request helpers
- notification normalization helpers
- offline persistence setup helpers

Primary commands:

```bash
npm test
npm run lint
npm run build
```

The build currently emits a known chunk-size warning because the admin surface is not route-split yet.

## 7. Current Known Gaps

- Public order tracking still needs a sanitized public tracking document or authenticated client-only tracking path.
- Payment and payroll flows should be converted to `writeBatch` or `runTransaction`.
- Quote-to-order conversion is not yet implemented.
- Admin quote review UI is not yet implemented.
- PWA app-shell caching and push/email/SMS delivery are not yet implemented.
- Route-level lazy loading should be added to reduce bundle size.
- Firestore emulator tests should cover the security denial cases in `security_spec.md`.
