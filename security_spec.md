# Security Specification: StitchMaster ERP

## Data Invariants
1. A client can only view their own measurements and order status.
2. An employee with 'admin' role can manage inventory, vendors, accounting, and employees.
3. Inventory changes must be logged (implied by ledger sync).
4. Financial transactions are immutable once created (accounting standard).
5. Orders must be linked to valid clients and employees.

## The "Dirty Dozen" Payloads (Anti-Patterns)
1. **Identity Theft**: Creating an order for another client by spoofing `clientId`.
2. **Resource Poisoning**: Injecting 1MB strings into measurement fields.
3. **Ghost Update**: Modifying `totalAmount` on an order after it has been finished.
4. **Account Hijack**: A non-admin user trying to credit/debit GL accounts.
5. **Orphan Reference**: Creating a transaction without a valid `debitAccountId`.
6. **Future Date Injection**: Setting `createdAt` to a future timestamp.
7. **Role Escalation**: Self-assigning 'admin' role in the employee record.
8. **Negative Stock**: Updating inventory to negative values.
9. **Vendor Spoofing**: Creating bills for non-existent vendors.
10. **State Skipping**: Moving an order from 'pending' directly to 'delivered'.
11. **PII Leak**: Querying for all clients' phone numbers as a regular user.
12. **Double Ledger**: Creating a transaction where credit and debit accounts are the same.
