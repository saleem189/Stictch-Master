# Module Documentation

## Public Storefront

Files:

- `src/pages/Home.tsx`
- `src/components/BrandLogo.tsx`

Responsibilities:

- Marketing homepage.
- Primary quote CTA.
- Order tracking form.

Execution flow:

1. User enters order ID.
2. `Home.tsx` queries `orders` with `where('__name__', '==', orderQuery)`.
3. The UI renders order status or an error.

Side effects:

- Firestore read against `orders`.

Important gap:

- Public unauthenticated reads of `orders` are denied by `firestore.rules`.

## Authentication and Routing

Files:

- `src/App.tsx`
- `src/contexts/UserContext.tsx`
- `src/lib/roleRouting.ts`
- `src/lib/publicRoutes.ts`

Responsibilities:

- Google sign-in.
- User profile loading.
- New-user client profile creation.
- Role-based route redirects.

Entry points:

- `/login`
- `/client`
- `/client/request-quote`
- `/admin/*`

## Client Portal and Quote Requests

Files:

- `src/pages/ClientDashboard.tsx`
- `src/pages/RequestQuote.tsx`
- `src/pages/QuoteRequests.tsx`
- `src/lib/quoteRequests.ts`

Responsibilities:

- Clients view own orders and quote requests.
- Clients submit `quoteRequests`.
- Staff review submitted quotes.

Not found in codebase:

- Quote-to-order conversion workflow.

## Orders and Production

Files:

- `src/pages/Orders.tsx`
- `src/components/NewOrderForm.tsx`
- `src/components/OrderDetailsModal.tsx`
- `src/components/PaymentModal.tsx`
- `src/lib/orderFinance.ts`

Responsibilities:

- Create orders.
- Create tasks.
- Track item workflow.
- Record payments.
- Print invoices.
- Send reminder notifications.

Side effects:

- Writes `orders`, `tasks`, `payments`, `financialDocuments`, `transactions`, `accounts`, and `notifications`.

## Clients and Measurements

Files:

- `src/pages/Clients.tsx`
- `src/lib/validation.ts`

Responsibilities:

- Manage clients and households.
- Maintain versioned measurements in `measurements`.

Side effects:

- Writes `clients`, `households`, and `measurements`.

## Inventory

Files:

- `src/pages/Inventory.tsx`
- `src/components/InventoryModal.tsx`
- `src/components/RollManagementModal.tsx`

Responsibilities:

- Manage inventory items.
- Track fabric rolls.
- Log fabric usage.

Side effects:

- Writes `inventory`, `fabricRolls`, and `inventoryLogs`.

## Accounting and Finance

Files:

- `src/pages/Accounting.tsx`
- `src/lib/ledger.ts`
- `src/lib/invoices.ts`
- `src/components/FinancialDocumentModal.tsx`
- `src/components/RecurringTransactionModal.tsx`

Responsibilities:

- Chart of accounts.
- Journal entries.
- Financial documents.
- Recurring transaction templates.

Side effects:

- Writes `financialDocuments`, `transactions`, `accounts`, and `recurringTransactions`.

## Employees and Payroll

Files:

- `src/pages/Employees.tsx`
- `src/components/EmployeeModal.tsx`
- `src/components/PayrollModal.tsx`

Responsibilities:

- Staff roster.
- Task board.
- Access-control UI.
- Payroll records and payout ledger entries.

Important gap:

- Duplicate payroll prevention was not found.

## Vendors and Procurement

Files:

- `src/pages/Vendors.tsx`
- `src/components/VendorModal.tsx`
- `src/components/VendorBillModal.tsx`

Responsibilities:

- Vendor records.
- Vendor bills.
- Outbound payments.
- Inventory procurement.

## Appointments

Files:

- `src/pages/Appointments.tsx`

Responsibilities:

- Schedule appointments.
- Mark appointments complete, cancelled, or no-show.

Not found in codebase:

- Scheduling conflict detection.

## Notifications

Files:

- `src/components/NotificationBell.tsx`
- `src/lib/notifications.ts`
- `src/services/notificationService.ts`

Responsibilities:

- Realtime notification display.
- Mark notifications as read.
- Create normalized notifications.

External delivery:

- `notificationService.ts` is mock-only.
