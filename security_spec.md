# Security Specification: Tailoring Empire ERP

## 1. Data Invariants
- **Orders**: Cannot exist without a valid `clientId` and `branchId`. Total amount must match the sum of items.
- **Financial Documents**: Must link to an `orderId` or `clientId`/`employeeId`. Status must be protected based on transaction types.
- **Payroll**: Only `admin` can create or update payroll records. Payment must sync with a ledger transaction.
- **Tasks**: Must belong to an `employeeId` and an `orderId`.

## 2. The "Dirty Dozen" Payloads (Denial Tests)
1. **Privilege Escalation**: User updating their own profile to `role: 'admin'`.
2. **Order Tampering**: User updating `paidAmount` of their own order without a valid transaction.
3. **Ghost Items**: Creating an order with a `totalAmount` that doesn't match the items sum (difficult to check in rules, so we check types).
4. **ID Poisoning**: Creating a client with a 2MB string as ID.
5. **PII Leak**: Accessing another client's measurement record without being assigned as their stitcher (simplified to `isEmployee()`).
6. **Financial spoofing**: Creating a `receipt` document as a client.
7. **Negative Ledger**: Creating a transaction with a negative amount (unless it's an adjustment).
8. **Inventory Drain**: Updating item quantity to negative.
9. **Status Shortcutting**: Skipping workflow stages in an order (e.g., pending -> delivered).
10. **Shadow Payroll**: Creating a payroll record for oneself.
11. **Cross-Tenant Access**: Reading branches one does not belong to (though it's a single-tenant enterprise for now).
12. **Malicious Notes**: Injected Large Blobs into `notes` fields.

## 3. Test Runner (Draft)
```ts
// firestore.rules.test.ts (conceptual)
// ... tests for each of the above ...
```
