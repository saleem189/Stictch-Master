# Role-Aware Client Portal Design

## Goal

StitchMaster should route authenticated users according to role and give clients a proper customer-facing experience instead of sending them to the admin console. The first online buying slice is a bespoke quote request flow, not fixed-price checkout.

## Product Model

The app has three audiences:

- Public visitors use `/` as the marketing storefront.
- Clients sign in and land on `/client`.
- Admins and employees sign in and land on `/admin`.

Clients do not need admin navigation. Their portal should focus on orders, quote requests, measurements, and account details. Employees and admins keep the current operational dashboard, with admin-only sections remaining restricted.

## Routing

Routes should be explicit:

- `/` public storefront and order tracking entry point.
- `/login` shared Google login.
- `/client` client account dashboard.
- `/client/request-quote` bespoke quote request form.
- `/admin/*` admin and employee dashboard routes.

After authentication:

- `admin` routes to `/admin`.
- `employee` routes to `/admin`.
- `client` routes to `/client`.
- Unknown or missing role falls back to `/` after profile creation.

## Client Portal

The client dashboard should include:

- A welcome/profile summary.
- Active orders owned by the client.
- Quote requests owned by the client.
- A measurements summary or placeholder for booking measurements.
- Primary action: Request Bespoke Quote.
- Secondary action: Track Existing Order.

The visual style should align with the current StitchMaster brand, but client pages should feel more storefront/account oriented than dense admin ERP screens.

## Quote Request MVP

The first online buying flow is an inquiry flow. The client submits enough information for staff to review and convert to a real order later.

Fields:

- Garment type.
- Style or fabric notes.
- Preferred due date.
- Budget range.
- Measurement source: existing measurements, book measurement, or enter later.
- Optional inspiration notes.

Statuses:

- `submitted`
- `reviewed`
- `converted`
- `rejected`

The form creates a `quoteRequests` document. It does not immediately create an `orders` document, a payment, or an accounting transaction.

## Firestore Model

Add a `QuoteRequest` type with:

- `id`
- `clientId`
- `clientName`
- `clientEmail`
- `garmentType`
- `styleNotes`
- `preferredDueDate`
- `budgetRange`
- `measurementSource`
- `inspirationNotes`
- `status`
- `createdAt`
- `updatedAt`

Security rules:

- Clients can create quote requests for their own `uid`.
- Clients can read their own quote requests.
- Admins and employees can read quote requests.
- Admins and employees can update status and review fields.

## Admin Follow-Up

The first implementation should not build full quote conversion UI yet. It should keep admin impact small:

- Admin/employee can see incoming quote requests in a later task.
- Conversion to a full order should be a separate implementation slice because it touches pricing, tasks, documents, and accounting.

## Error Handling

The quote request form should show loading state, success toast, and visible validation errors. Firestore writes should use `handleFirestoreError`.

Auth/profile loading should avoid flicker and avoid sending clients through `/admin` before their profile loads.

## Testing

Add focused tests for role-route selection and quote request validation/helpers where practical. Keep rendered browser QA for the final implementation pass if the browser tooling is available.

## Out Of Scope

- Cart.
- Online payments.
- Product inventory checkout.
- Quote-to-order conversion.
- Staff quote management table.
- Public unauthenticated quote submission.
