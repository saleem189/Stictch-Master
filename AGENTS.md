# AI Agent Instructions & Project Context

This file is the source of truth for AI agents working on Tailoring ERP.

## 1. Project Identity

- **Name:** Tailoring ERP
- **Mission:** A high-end, bilingual Enterprise Resource Planning and client portal system for bespoke tailoring businesses.
- **Brand asset:** `src/assets/stitchmaster-logo.png`
- **Brand component:** `src/components/BrandLogo.tsx`
- **Aesthetic:** high-contrast, intelligence-focused, bold italic headings, rounded containers, and Swiss/Modern visual structure.
- **Design paradigm:** matrix of information for staff surfaces; polished storefront/account experience for client surfaces.

## 2. Product Surfaces

### Public Storefront

- Route: `/`
- Purpose: explain the tailoring business, promote bespoke quote requests, and expose order tracking.
- Primary CTA: `Request Bespoke Quote`.

### Client Portal

- Route: `/client`
- Purpose: client-owned order overview, quote request history, measurement status, and account actions.
- Quote route: `/client/request-quote`
- Quote requests create `quoteRequests` documents with `status: submitted`.

### Admin/Employee ERP

- Route: `/admin/*`
- Purpose: operations, production, clients, appointments, inventory, finances, payroll, vendors, and branches.
- Employees can access operational modules.
- Admin-only routes include vendors, accounting, employees, and branches.

## 3. Technical Stack & Directory Mapping

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend:** Cloud Firestore, Firebase Authentication.
- **i18n:** i18next and react-i18next for English/Urdu.
- **Visualization:** Recharts.
- **Tests:** Vitest with jsdom setup.

Directory map:

- `src/components`: shared UI and feature modals.
- `src/pages`: top-level route components.
- `src/contexts`: auth/user providers.
- `src/lib`: Firebase, i18n, validation, routing, finance, automation, export helpers.
- `src/services`: external service integrations.
- `src/types.ts`: centralized TypeScript interfaces.
- `firebase-blueprint.json`: Firestore schema documentation.
- `firestore.rules`: deployed access model.

## 4. Standards & Conventions

### UI/UX

1. Do not hardcode new user-visible strings when a surface is already using i18n. Add keys to `src/lib/i18n.ts`.
2. Urdu must respect RTL document direction.
3. Headings use `font-black text-slate-900 tracking-tight italic uppercase`.
4. Labels use `text-[10px] font-black text-slate-400 uppercase tracking-widest`.
5. Main containers use `bg-white rounded-[2.5rem] border border-slate-200 shadow-sm`.
6. Use `BrandLogo` for app identity instead of recreating logo markup.
7. Use `AlertCircle` and red text for visible validation errors.

### Data and Firestore

1. Use `handleFirestoreError` for Firestore operations.
2. Add new collection paths to `firebase-blueprint.json`.
3. Add or update `firestore.rules` for every new collection or subcollection.
4. Keep client-owned data scoped to `request.auth.uid`.
5. Payments must sync between orders, payments, transactions, financial documents, and accounts.
6. Prefer `writeBatch` or `runTransaction` for multi-document financial writes.
7. Orders and personnel activity require audit trails.

### Routing

Role routing lives in `src/lib/roleRouting.ts`.

- `admin` -> `/admin`
- `employee` -> `/admin`
- `client` -> `/client`
- unknown -> `/`

Do not duplicate role-routing logic inside page components.

## 5. Current Module Flows

### Quote Request Flow

1. Public or signed-in client clicks `Request Bespoke Quote`.
2. Unauthenticated users are redirected through `/login`.
3. Client users continue to `/client/request-quote`.
4. Form validation is handled by `src/lib/quoteRequests.ts`.
5. A `quoteRequests` document is created with `status: submitted`.
6. Staff quote review and quote-to-order conversion are future modules.

### Order Lifecycle

1. Order is linked to `Client` and `Branch`.
2. Global status: `pending`, `in-progress`, `ready`, `delivered`, `cancelled`.
3. Item workflow can track granular production stages such as measurement, cutting, stitching, trial, and finishing.
4. Payment status is tracked through `paidAmount` against `totalAmount`.

### Financial Matrix

- Every transaction should include `debitAccountId` and `creditAccountId`.
- Documents include quotation, advance invoice, receipt, final invoice, expense, payroll, and refund.
- Dashboard uses orders, transactions, inventory, and accounting data for operational intelligence.

### Inventory and Personnel

- Inventory tracks quantity, minimum levels, roll tracking, and stock logs.
- Personnel tracks employees, tasks, payroll records, and linked users.

## 6. Development Checklist

- [ ] Add user-visible strings to `src/lib/i18n.ts`.
- [ ] Add new data shapes to `src/types.ts`.
- [ ] Add new Firestore paths to `firebase-blueprint.json`.
- [ ] Update `firestore.rules` for new collections.
- [ ] Add focused unit tests for pure helpers and business rules.
- [ ] Run `npm test`, `npm run lint`, and `npm run build`.
- [ ] If Node is not on PATH in Codex, run commands through `C:\Program Files\nodejs\node.exe`.
