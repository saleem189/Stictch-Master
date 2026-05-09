# Tailoring Empire Technical Specification

This document provides a deep dive into the technical architecture, operational flows, and module-level specifications of the Tailoring Empire ERP.

## 1. System Architecture

Tailoring Empire is a cloud-native ERP built with a "Zero-Trust" data model and a "Matrix" UI philosophy.

### Frontend Stack
- **Framework:** React 18+ (Vite)
- **Styling:** Tailwind CSS v4
- **Animations:** Motion (Framer Motion)
- **Icons:** Lucide React
- **Internationalization:** i18next
- **Charts:** Recharts

### Backend / Data Transition
- **Database:** Firebase Cloud Firestore
- **Authentication:** Firebase Auth (Google Provider)
- **Storage:** Standardized JSON structures in Firestore

## 2. Core Operational Flows

### 2.1. The Client Lifecycle
1. **Onboarding:** Client added via `Clients` module. Optional measurement profile created.
2. **Engagement:** Appointment scheduled or Order placed.
3. **History:** All orders and payments linked to `clientId`.

### 2.2. The Bespoke Order Pipeline (BOP)
Every order follows a strict state transition:
- `pending` -> `measurement` -> `pattern-making` -> `cutting` -> `stitching` -> `trial` -> `ready` -> `delivered`.
- **Relational Integrity:** Orders contain `items`. Each item can have its own status, but the order status tracks the overall maturity.

### 2.3. The Double-Entry Accounting Matrix
- Every monetary event creates a `Transaction`.
- **Debit/Credit Logic:**
  - Order Advance: Debit `Cash`, Credit `Customer Deposits`.
  - Final Payment: Debit `Cash`, Credit `Sales Revenue`.
  - Payroll: Debit `Wage Expense`, Credit `Cash`.

## 3. Module Specifications

### 3.1. Dashboard (The Brain)
- **Tech:** Recharts for visualization.
- **Logic:** Aggregates real-time stats from `orders`, `transactions`, and `inventory`.
- **Automation:** Proactively calls `processRecurringTransactions()` on mount to ensure ledger accuracy.

### 3.2. Inventory (The Supply Chain)
- **Bento Grid Layout:** Visual representation of fabrics and notions.
- **Thresholds:** `minLevel` triggers UI alerts and system notifications.

### 3.3. Personnel & Payroll
- **Staff Tracking:** Employees linked to specific branches.
- **Payroll Generation:** Monthly cycles based on fixed salary + performance bonuses.

## 4. Technical Standards

### 4.1. Coding Conventions
- **Naming:** CamelCase for functions/vars, PascalCase for components/types.
- **Bilingualism:** No hardcoded strings. Use `t()` helper logic.
- **Error Handling:** All Firestore operations MUST wrap in `try-catch` with `handleFirestoreError`.

### 4.2. UI/UX Paradigm
- **Roundedness:** Use `rounded-3xl` or `rounded-[2.5rem]` for main containers.
- **Typography:** Swiss-Modern mix. Italicized font-black headings for a "High-End" feel.
- **Feedback:** Standardized `toast` notifications for all write operations.

## 5. Security Model (Firestore Rules)

- **Identity-Based:** Access controlled via `request.auth.uid`.
- **Role-Based (RBAC):** Admin-only collections (Accounting, Employees) restricted via `isAdmin()` helper.
- **Integrity:** `isValidId()` and `isValid[Entity]()` validation helpers on all writes.

## 6. Future Roadmap (AI Integration)
- **Style Synthesis:** Using Gemini to suggest suit styles based on measurements.
- **Voice Entry:** Master tailors dictating measurements via Gemini Multimodal.
- **Automated Reordering:** AI predicting stock depletion based on order velocity.
