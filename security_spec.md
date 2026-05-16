# Security Specification: Tailoring ERP

## 1. Data Invariants

- **Users:** Self-created profiles must be `client` role with safe permissions only.
- **Quote Requests:** Clients can create and read only their own quote requests. Staff can read and review them.
- **Orders:** Orders require a `clientId`, `branchId`, non-negative `totalAmount`, and at least one item.
- **Payments:** Payment writes must not leave orders, payment records, transactions, documents, and accounts out of sync.
- **Financial Documents:** Financial documents must link to an order, client, employee, or valid expense category.
- **Payroll:** Only admins can create or update payroll records.
- **Tasks:** Tasks must belong to an `employeeId` and `orderId`.
- **Inventory:** Quantity cannot be negative.
- **Notifications:** Users can only create notifications for themselves unless they are admin.

## 2. Role Boundaries

- `client`: public storefront, `/client`, own orders, own quote requests, own profile.
- `employee`: `/admin` operational modules, client/order/appointment/inventory work.
- `admin`: full `/admin` access including accounting, vendors, employees, branches, payroll, and settings-level operations.

Route guards are app-level convenience checks. Firestore rules remain the authority.

## 3. Dirty Dozen Denial Tests

These should be covered by Firestore emulator tests.

1. User creates their own profile with `role: admin`.
2. Client reads another client's quote request.
3. Client creates a quote request for another `clientId`.
4. Client updates a quote request status to `converted`.
5. Client reads another client's order.
6. Client updates `paidAmount` on an order.
7. Client creates a financial document or transaction.
8. Employee creates payroll for themselves.
9. Non-admin updates employee permissions.
10. Inventory quantity is updated below zero.
11. Notification is created for another user by a non-admin.
12. Large or script-like notes are submitted to user-controlled text fields.

## 4. Current Rule Coverage

Implemented in `firestore.rules`:

- Self-signup restriction through `isValidSelfSignup`.
- Role helpers through `isAdmin()` and `isEmployee()`.
- `quoteRequests` create/read/update boundaries.
- Non-negative inventory quantity guard.
- Notification target ownership guard.
- Profile request ownership/admin boundaries.

## 5. Remaining Security Work

- Add Firestore emulator tests for the denial list above.
- Move multi-document financial flows to `writeBatch` or `runTransaction`.
- Add quote-to-order conversion rules when that workflow is implemented.
- Replace public order tracking with sanitized tracking documents or authenticated client-only tracking.
- Continue tightening allowed keys and string-size limits in rules.
