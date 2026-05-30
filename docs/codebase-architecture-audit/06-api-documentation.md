# API Documentation

No HTTP API endpoints were found in the codebase. There are no Express routes, Vite server routes, server actions, or API controllers.

The implemented API surface is direct Firestore client access.

## Firestore API Surface

| Path | Methods by Code | Auth Model |
|---|---|---|
| `users/{uid}` | get, set, update, list | owner/admin, self-signup as client |
| `orders/{orderId}` | get/list/create/update | owning client read, employee/admin staff access |
| `quoteRequests/{id}` | create/read/update | client own create/read, staff read/review |
| `clients/{id}` | list/create/update/get | staff access, own client get by matching uid |
| `measurements/{id}` | list/create | employee/admin |
| `appointments/{id}` | list/create/update | staff, owning client read |
| `inventory/{id}` | list/create/update | employee/admin |
| `fabricRolls/{id}` | list/create/update | employee/admin |
| `inventoryLogs/{id}` | list/create | employee/admin |
| `tasks/{id}` | list/create/update | employee/admin, admin create |
| `employees/{id}` | list/create/update | employee read, admin write |
| `accounts/{id}` | list/update | admin |
| `transactions/{id}` | list/create | admin |
| `financialDocuments/{id}` | list/create/update | employee create/read, admin update |
| `payments/{id}` | list/create | admin |
| `vendors/{id}` | list/create/update | employee read, admin write |
| `vendorBills/{id}` | list/create/update | employee read, admin write |
| `payrollRecords/{id}` | list/create | admin or matching employee read |
| `notifications/{id}` | listen/create/update | owner/admin read, owner mark read |
| `profileRequests/{id}` | list/create/update | owner/admin |
| `branches/{id}` | list/create/update | signed-in read, admin write |
| `households/{id}` | list/create/update | employee/admin |
| `recurringTransactions/{id}` | list/create/update/delete | admin |

## OpenAPI Status

Unable to generate real OpenAPI paths because no HTTP server API exists in source.
