# Mermaid Diagrams

## System Architecture

```mermaid
flowchart LR
  Browser[React SPA] --> Router[React Router]
  Router --> Auth[Firebase Auth]
  Router --> Firestore[Cloud Firestore]
  Firestore --> Rules[firestore.rules]
  Browser --> LocalCache[Firestore IndexedDB Persistence]
  Browser --> WhatsApp[wa.me deep link]
  Browser --> Unsplash[Homepage image URL]
```

## Request Lifecycle

```mermaid
flowchart TD
  A[Browser opens route] --> B[React Router in App.tsx]
  B --> C[UserProvider waits for Firebase Auth]
  C --> D[Load users/{uid} profile]
  D --> E{Role and route}
  E -->|public| H[Render Home]
  E -->|client| I[Render ClientDashboard or RequestQuote]
  E -->|admin/employee| J[Render AdminLayout and module]
  I --> K[Firestore read/write]
  J --> K
  K --> L[firestore.rules authorize]
  L --> M[onSnapshot/getDocs/updateDoc/writeBatch response]
```

## Financial Write Flow

```mermaid
flowchart TD
  A[User submits payment/order/payroll/vendor bill] --> B[Component validates form state]
  B --> C[Fetch accounts]
  C --> D[Create writeBatch]
  D --> E[Domain document]
  D --> F[payments/payroll/vendorBills/financialDocuments]
  D --> G[transactions]
  D --> H[accounts balance increments]
  D --> I[batch.commit]
```

## Recurring Transaction Flow

```mermaid
flowchart TD
  A[Dashboard loads] --> B[processRecurringTransactions]
  B --> C[Query active recurringTransactions due today]
  C --> D[Fetch accounts]
  D --> E[Batch transaction and account balance updates]
  E --> F[Update lastProcessed and nextDueDate]
```

## Data Relationships

```mermaid
erDiagram
  users ||--o| clients : "clientId or uid"
  clients ||--o{ orders : clientId
  clients ||--o{ quoteRequests : clientId
  clients ||--o{ measurements : clientId
  clients ||--o{ appointments : clientId
  branches ||--o{ orders : branchId
  employees ||--o{ tasks : employeeId
  orders ||--o{ tasks : orderId
  orders ||--o{ payments : referenceId
  orders ||--o{ financialDocuments : orderId
  vendors ||--o{ vendorBills : vendorId
  vendors ||--o{ payments : entityId
  accounts ||--o{ transactions : debitAccountId
  accounts ||--o{ transactions : creditAccountId
  inventory ||--o{ fabricRolls : inventoryId
  inventory ||--o{ inventoryLogs : inventoryId
```

## Background Job Flow

Not found in codebase as a real worker/queue/scheduler. The closest implemented flow is the dashboard-triggered recurring transaction helper above.
