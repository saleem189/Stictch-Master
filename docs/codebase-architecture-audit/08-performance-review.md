# Performance Review

## Potential Bottlenecks

- `src/pages/Dashboard.tsx` reads entire `orders`, `clients`, `inventory`, and `transactions`.
- `src/pages/Employees.tsx` reads all employees, tasks, accounts, users, and payroll records.
- `src/pages/Vendors.tsx` reads all vendors, bills, payments, inventory, and accounts.
- `src/pages/Accounting.tsx` reads latest 100 financial documents and transactions but all accounts and recurring transactions.
- Route-level code splitting was not found.
- Firestore composite index file was not found.

## N+1 Risks

Most pages batch-fetch collections rather than doing classic N+1 network loops. However, joins are done client-side, which becomes expensive as collections grow.

## Cache Opportunities

- Firestore offline persistence is enabled.
- No application-level cache found.
- No precomputed dashboard aggregate documents found.

## Recommendations

Critical/high:

- Add pagination to orders, clients, payments, vendor bills, payroll, and financial documents.
- Add server-side or precomputed dashboard aggregates.
- Use Firestore count/aggregate queries where possible.

Medium:

- Add `React.lazy()` route splitting for admin modules.
- Add `firestore.indexes.json`.
- Replace dashboard-triggered recurring processing with backend scheduled processing.

Low:

- Add loading skeletons consistently.
- Normalize realtime use by surface importance.
