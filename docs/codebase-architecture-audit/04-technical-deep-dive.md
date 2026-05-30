# Technical Deep Dive

## Request Lifecycle

1. `src/main.tsx` renders `App`.
2. `src/App.tsx` mounts React Router and `UserProvider`.
3. `UserProvider` listens to Firebase Auth using `onAuthStateChanged`.
4. If authenticated, the app reads `users/{uid}`.
5. If no profile exists, a client profile is created.
6. Route guards use `roleRouting.ts`.
7. Pages/components perform Firestore operations.
8. `firestore.rules` authorize or deny the operation.
9. UI renders data, loading state, or error state.

## Background Processing

No queue, worker, or backend scheduler was found.

Implemented helper:

- `src/lib/automation.ts` exports `processRecurringTransactions()`.

Actual execution:

- `Dashboard.tsx` invokes `processRecurringTransactions()` when the dashboard loads.

Implication:

- Recurring transactions depend on an admin/employee opening the dashboard. This is not reliable background processing.

## Event-Driven Architecture

Implemented realtime event flows:

- `useFirestoreQuery()` wraps Firestore `onSnapshot`.
- `NotificationBell` listens to `notifications` where `userId == current uid`.
- `Orders` and `ClientDashboard` use realtime query state.

Not found in codebase:

- Pub/sub topics.
- Event bus.
- Webhooks.
- Broadcast channels.
- Server-side listeners.

## Integration Architecture

Implemented integrations:

- Firebase Auth.
- Cloud Firestore.
- WhatsApp deep link in `Orders.tsx` and client cards.
- Unsplash image URL in `Home.tsx`.

Declared but not actively used:

- `@google/genai` dependency.
- `process.env.GEMINI_API_KEY` Vite define.

Mock integration:

- `src/services/notificationService.ts`.

## Key Data Flows

### Quote Request

1. Client navigates to `/client/request-quote`.
2. Form state is initialized by `getInitialQuoteRequestForm()`.
3. `validateQuoteRequestForm()` checks required fields.
4. `RequestQuote.tsx` writes a new document in `quoteRequests`.
5. Document has `status: submitted`.
6. User is navigated back to `/client`.

### Order Creation

1. Staff opens `NewOrderForm`.
2. Form loads clients, employees, branches, accounts.
3. User submits order items, due date, branch, assignee, optional advance payment.
4. A Firestore batch writes:
   - `orders`
   - optional `tasks`
   - `transactions`
   - account balance updates
   - optional `payments`
   - optional receipt document
5. A notification is created after batch commit.

### Payroll

1. Admin opens payroll flow.
2. Employees and accounts are loaded.
3. User commits payroll.
4. A batch writes `payrollRecords`, `transactions`, account updates, and `auditLogs`.

Duplicate-period prevention was not found.
