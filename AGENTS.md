# AI Agent Instructions & Project Context

This file is the **Source of Truth** for AI agents working on the Tailoring Empire ERP. It contains the complete architectural blueprint, technical standards, and operational flows.

## 1. Project Identity
- **Name:** Tailoring Empire ERP
- **Mission:** A high-end, bilingual (English/Urdu) Enterprise Resource Planning system for bespoke tailoring businesses.
- **Aesthetic:** High-contrast, "Intelligence" focused, bold typography (italic headings), heavy use of rounded corners (`rounded-3xl`), and a clean, professional "Swiss/Modern" feel.
- **Design Paradigm:** "Matrix of Information" — density without clutter, using bento grids and layered modals.

## 2. Technical Stack & Directory Mapping

### Core Technologies
- **Frontend:** React 18+ (Vite), Tailwind CSS v4, Lucide Icons, Framer Motion.
- **Backend:** Cloud Firestore, Firebase Authentication.
- **i18n:** i18next & react-i18next (English/Urdu).
- **Visualization:** Recharts & D3.

### Directory Structure
- `src/components`: Atomic UI components and feature-specific modals (Orders, Payroll, etc.).
- `src/pages`: Top-level route components.
- `src/contexts`: Global state providers (User/Auth).
- `src/lib`: Core logic (Firebase, i18n, validation, automation, export).
- `src/services`: External integrations (Notifications).
- `src/types.ts`: Centralized TypeScript interfaces.

## 3. Standards & Conventions

### UI/UX Rules
1. **Bilingual:** NEVER hardcode strings. Use `t()`. Urdu is RTL.
2. **Typography:**
   - Headings: `font-black text-slate-900 tracking-tight italic uppercase`.
   - Labels: `text-[10px] font-black text-slate-400 uppercase tracking-widest`.
3. **Containers:** `bg-white rounded-[2.5rem] border border-slate-200 shadow-sm`.
4. **Validation:** Use `src/lib/validation.ts`. Show errors in red with `AlertCircle`.

### Data Intelligence Rules
1. **Error Handling:** Use `handleFirestoreError` for ALL Firestore operations.
2. **Relational Sync:** 
   - Payments must sync between `orders`, `transactions`, `financialDocuments`, and `accounts`.
   - Use `increment()` for atomic balance updates.
3. **Audit Trails:** Mandatory for Orders and Personnel activity.

## 4. Detailed Module Flows

### 4.1. The Order Lifecycle
1. **Creation:** Linked to `Client` and `Branch`. Audit log entry: "Order Created".
2. **Workflow:** 
   - `Pending` (Initial)
   - `In-Progress` (Assigned to cutting/stitching)
   - `Ready` (Ready for trial or pickup)
   - `Delivered` (Terminal - triggers final receipt)
3. **Financials:** 
   - `totalAmount` is calculated from item prices.
   - `paidAmount` tracks total receipts.
   - Payments record a `Transaction` (type: 'sale').

### 4.2. Financial Matrix (Accounting)
- **Automatic Ledger:** Every transaction must have a `debitAccountId` (e.g., Cash) and `creditAccountId` (e.g., Sales Revenue).
- **Documents:** `quotation` (pre-sale), `advance-invoice` (deposit), `receipt` (payment check), `final-invoice` (at delivery).
- **Calculations:** Dashboard uses `accounting` module data for MTD Revenue and Receivables.

### 4.3. Resource Management (Inventory & Personnel)
- **Inventory:** Tracks fabric yardage and notions. Low stock alert triggered at `minLevel`.
- **Personnel:** Tracks `Employee` records. Payroll auto-calculates based on salary structure and generated transactions.

## 5. Security & Maintenance
- **Rules:** Access mapped in `firestore.rules`. Admins checked via `/admins/` collection.
- **Reporting:** Export operational data using `exportToCSV` from `src/lib/exportUtils.ts`.
- **AI Readiness:** See `GEMINI.md` for prompt engineering patterns.

## 6. Development Checklist for Future Agents
- [ ] Check if new strings are added to `src/lib/i18n.ts`.
- [ ] Ensure new Firestore paths are added to `firebase-blueprint.json`.
- [ ] Verify `firestore.rules` for every new subcollection.
- [ ] Use `motion/react` for all state-driven UI entrances.
