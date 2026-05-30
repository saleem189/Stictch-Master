# File Reference Map

## App Shell

| File | Responsibility |
|---|---|
| `src/main.tsx` | React bootstrap and i18n import |
| `src/App.tsx` | Router, login, admin layout, route guards |
| `src/index.css` | Global styles |

## Auth and Firebase

| File | Responsibility |
|---|---|
| `src/lib/firebase.ts` | Firebase app, Firestore, Auth, offline persistence startup, Firestore error handler |
| `src/contexts/UserContext.tsx` | Auth listener, profile loading, default client profile provisioning |
| `src/lib/offlinePersistence.ts` | Firestore IndexedDB persistence wrapper |

## Routing

| File | Responsibility |
|---|---|
| `src/lib/roleRouting.ts` | Role landing and route access helpers |
| `src/lib/publicRoutes.ts` | Routes allowed before auth loading finishes |
| `src/lib/adminNavigation.ts` | Admin nav item definitions and grouping |

## Pages

| File | Responsibility |
|---|---|
| `src/pages/Home.tsx` | Public storefront and order tracking |
| `src/pages/ClientDashboard.tsx` | Client portal overview |
| `src/pages/RequestQuote.tsx` | Client quote request form |
| `src/pages/QuoteRequests.tsx` | Staff quote review |
| `src/pages/Dashboard.tsx` | Admin analytics dashboard |
| `src/pages/Orders.tsx` | Order table and order actions |
| `src/pages/Clients.tsx` | Clients, households, measurement history |
| `src/pages/Inventory.tsx` | Inventory list and roll entry points |
| `src/pages/Accounting.tsx` | Ledger, documents, recurring transactions |
| `src/pages/Employees.tsx` | Staff, tasks, access control, payroll |
| `src/pages/Vendors.tsx` | Vendor and procurement management |
| `src/pages/Appointments.tsx` | Appointment scheduling and status |
| `src/pages/Branches.tsx` | Branch management |
| `src/pages/Profile.tsx` | Profile updates and employee approval requests |

## Components

| File | Responsibility |
|---|---|
| `src/components/BrandLogo.tsx` | Brand rendering |
| `src/components/LanguageToggle.tsx` | Language switching |
| `src/components/NotificationBell.tsx` | Realtime notifications |
| `src/components/NewOrderForm.tsx` | Order creation |
| `src/components/PaymentModal.tsx` | Client payment recording |
| `src/components/OrderDetailsModal.tsx` | Workflow, payment, audit tabs |
| `src/components/FinancialDocumentModal.tsx` | Financial document creation and preview |
| `src/components/PayrollModal.tsx` | Manual payroll processing |
| `src/components/VendorBillModal.tsx` | Procurement bill creation |
| `src/components/RollManagementModal.tsx` | Fabric roll and usage management |
| `src/components/layout/AppLayout.tsx` | Shared page shell/header/card components |

## Domain Helpers

| File | Responsibility |
|---|---|
| `src/lib/ledger.ts` | Double-entry ledger helpers and account deltas |
| `src/lib/invoices.ts` | Invoice totals, numbers, currency formatting |
| `src/lib/orderFinance.ts` | Order totals and payment status helpers |
| `src/lib/quoteRequests.ts` | Quote form/review validation |
| `src/lib/notifications.ts` | Notification creation and normalization |
| `src/lib/validation.ts` | Generic form validators |
| `src/lib/automation.ts` | Recurring transaction processing helper |
| `src/lib/seeder.ts` | Firestore seed writes |
| `src/lib/seedData.ts` | Demo seed records |
| `src/lib/i18n.ts` | English/Urdu translation resources |
