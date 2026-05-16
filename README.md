# Tailoring ERP

A bilingual tailoring business platform for client-facing quote requests and role-based ERP operations.

![Tailoring ERP logo](./src/assets/stitchmaster-logo.png)

## Current Product Shape

- **Public storefront:** Marketing homepage, service positioning, and order tracking entry point.
- **Client portal:** Authenticated clients land on `/client`, can view their orders and quote requests, and can request a bespoke quote.
- **Admin/employee ERP:** Staff land on `/admin` and use operational dashboards for orders, clients, appointments, inventory, accounting, payroll, vendors, and branches.
- **Bespoke inquiry flow:** `/client/request-quote` creates a `quoteRequests` Firestore document. It does not immediately create orders, payments, or ledger entries.
- **Realtime foundation:** Orders and the client portal use Firestore listeners with cache/sync indicators. Notifications listen live and can be cleared from the bell menu.
- **Offline foundation:** Firestore multi-tab IndexedDB persistence is enabled during Firebase startup when the browser supports it.
- **Bilingual foundation:** English/Urdu strings live in `src/lib/i18n.ts`; Urdu uses RTL document direction.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Motion, Lucide React
- **Backend:** Firebase Authentication and Cloud Firestore
- **Charts:** Recharts
- **Testing:** Vitest, Testing Library setup, TypeScript, ESLint

## Key Routes

- `/` public storefront
- `/login` shared Google login
- `/client` client dashboard
- `/client/request-quote` bespoke quote request form
- `/admin/*` admin and employee ERP dashboard

Role routing is centralized in `src/lib/roleRouting.ts`.

Realtime and robustness helpers are centralized in `src/hooks/useFirestoreQuery.ts`, `src/lib/notifications.ts`, and `src/lib/offlinePersistence.ts`.

## Firestore Collections

Core collections are documented in `firebase-blueprint.json`.

Important current collections include:

- `users`
- `clients`
- `orders`
- `quoteRequests`
- `measurements`
- `appointments`
- `inventory`
- `fabricRolls`
- `inventoryLogs`
- `employees`
- `tasks`
- `payrollRecords`
- `accounts`
- `transactions`
- `payments`
- `financialDocuments`
- `vendors`
- `vendorBills`
- `notifications`
- `profileRequests`
- `recurringTransactions`
- `households`
- `branches`

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Run verification:

```bash
npm test
npm run lint
npm run build
```

In this Codex Windows environment, Node may need to be invoked directly:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\vitest\vitest.mjs run
& 'C:\Program Files\nodejs\node.exe' .\node_modules\typescript\bin\tsc --noEmit
& 'C:\Program Files\nodejs\node.exe' .\node_modules\eslint\bin\eslint.js .
& 'C:\Program Files\nodejs\node.exe' .\node_modules\vite\bin\vite.js build
```

## Security Notes

- Deploy `firestore.rules` whenever Firestore schema or route behavior changes.
- New self-created users default to `client`.
- Admin/employee access is derived from role documents in `users`.
- Client quote requests are scoped to the authenticated user's `uid`.
- Do not expose private AI/API keys in the browser bundle.

## Documentation

- `AGENTS.md`: source of truth for AI agents and implementation standards.
- `TECHNICAL_SPEC.md`: architecture, route map, data model, and workflows.
- `security_spec.md`: security invariants and denial-test scenarios.
- `GEMINI.md`: future AI integration patterns and safety notes.
- `AUDIT_REPORT.md`: latest production audit and remaining risks.
