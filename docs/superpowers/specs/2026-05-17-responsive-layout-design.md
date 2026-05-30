# Tailoring ERP Responsive Layout Redesign Spec

## Goal

Redesign Tailoring ERP around one responsive design system that supports three product surfaces:

- Staff ERP at `/admin/*`: dense operational command center for admins and employees.
- Client portal at `/client` and `/client/request-quote`: polished account experience for orders, quote requests, and measurements.
- Public storefront at `/`: refined brand entry point for quote requests and order tracking.

The first implementation priority is the staff ERP shell because it carries the most modules, RBAC differences, tables, forms, and daily workflow pressure. Client and public surfaces should inherit the same visual language without becoming as dense as the staff workspace.

## Current Layout Findings

### Strengths

- The app already has a strong brand direction: high contrast, italic uppercase headings, slate/indigo palette, and premium rounded containers.
- The route model is clean: `/`, `/client`, `/client/request-quote`, and `/admin/*` are separated by role-routing helpers.
- Core surfaces already exist for clients, admin, employees, orders, inventory, vendors, accounting, branches, appointments, and quote review.
- The new seed data and RBAC demo records make it possible to test admin, employee, and client states once matching Firebase Auth users exist.

### Issues To Fix

- The public homepage still has mobile overflow risk in the hero/nav area. Prior screenshots showed clipped text and an off-canvas admin CTA on narrow screens.
- Admin pages use many independent card and table patterns. This makes modules feel related but not fully systematic.
- Staff tables rely heavily on horizontal scrolling with `min-w-[500px]` to `min-w-[800px]`. That works as a fallback, but mobile staff workflows need card rows, compact filters, and sticky actions.
- Mobile admin navigation currently uses a slide-out sidebar. It works, but daily operators need faster access to Dashboard, Orders, Quotes, Clients, Inventory, and Profile.
- Client portal is visually calmer, but several strings are hardcoded and should be moved into `src/lib/i18n.ts`.
- `document.documentElement.dir` is set in both `AppContent` and `AdminLayout`; direction handling should become one app-level responsibility.
- Some UI copy and encoded characters need cleanup, such as the storefront footer copyright text.

## Proposed Direction

Use an "atelier command center" system: operational, scan-friendly, and high-end. The staff UI should feel like a live production matrix, while client/public surfaces should feel curated and premium.

The design should preserve the established Tailoring ERP standards:

- Headings: `font-black text-slate-900 tracking-tight italic uppercase`.
- Labels: `text-[10px] font-black text-slate-400 uppercase tracking-widest`.
- Main containers: `bg-white rounded-[2.5rem] border border-slate-200 shadow-sm`.
- Brand identity: always use `BrandLogo`.
- Validation: use `AlertCircle` and red error text.
- Urdu: app-level RTL and localized strings through i18n.

## Design System

### Layout Tokens

- Page gutter: `px-4 sm:px-6 lg:px-8`.
- Page max width:
  - Dashboard and module pages: `max-w-[1440px]`.
  - Forms and focused client flows: `max-w-3xl` to `max-w-5xl`.
  - Storefront: `max-w-7xl`.
- Vertical rhythm:
  - Mobile: `gap-4`, `py-5`.
  - Tablet: `gap-6`, `py-6`.
  - Desktop: `gap-8`, `py-8`.
- Container radius:
  - Standard modules: `rounded-[2rem]` on mobile, `sm:rounded-[2.5rem]` on larger screens.
  - Inputs/buttons: `rounded-2xl`.
  - Badges: `rounded-full`.

### Color Roles

- Base: white, slate-50, slate-100, slate-200, slate-400, slate-500, slate-900, slate-950.
- Primary: indigo-600 for main actions and active navigation.
- Positive: green-600 for paid, delivered, healthy inventory.
- Warning: amber-500/600 for low stock, due soon, review states.
- Danger: red-600 for validation, failures, rejected requests.
- Avoid adding more decorative purple gradients. Keep the UI from becoming one-note indigo by using status color meaning, not broad color washes.

### Component Primitives

- `PageShell`: consistent page padding, max width, mobile bottom spacing, and optional sticky action area.
- `PageHeader`: title, eyebrow, subtitle, primary action, secondary actions, sync/offline state.
- `ModuleCard`: the standard white rounded bordered surface.
- `MetricTile`: compact stat with label, value, delta/status, and optional icon.
- `StatusBadge`: shared status-to-color mapping for orders, quotes, payments, inventory, tasks, and appointments.
- `ActionBar`: responsive command row that wraps on desktop and becomes a sticky bottom action group on mobile when needed.
- `DataView`: table on desktop, row cards on mobile, with the same source data.
- `FilterRail`: collapsible filter/search/sort panel for module lists.
- `EmptyState`: dashed or quiet panel with one clear next action.
- `FormSection`: labeled form groups with consistent input, select, textarea, segmented choice, and validation styles.

## Responsive Navigation

### Staff ERP

Desktop:

- Keep a left rail, but make it more structured:
  - Brand and workspace switcher at top.
  - Primary operations: Dashboard, Work Orders, Quote Review, Clients, Appointments, Inventory.
  - Admin-only: Vendors, General Ledger, Employees, Branches.
  - Account: Profile and Sign Out.
- Add a compact current-module header in the top bar with breadcrumbs and global action buttons.

Tablet:

- Collapse rail into icon-only width, with tooltips.
- Keep top bar actions visible: language, notifications, sync state, profile.

Mobile:

- Replace day-to-day navigation with a bottom tab bar:
  - Dashboard
  - Orders
  - Quotes
  - Clients
  - Inventory
- Put remaining modules in a `More` sheet, respecting RBAC.
- Use a sticky page action button for the main task on each module.

### Client Portal

- Mobile-first header with `BrandLogo`, quote CTA, and profile/menu.
- Bottom client nav:
  - Overview
  - Orders
  - Quotes
  - Measurements
  - Account
- Client portal should not inherit the dense staff side rail.

### Public Storefront

- Mobile nav should fit without horizontal scroll:
  - Brand left.
  - Primary CTA/icon menu right.
  - Hide secondary anchors behind menu on small screens.
- Hero should use a one-column mobile flow, no absolute stat card extending past viewport, and no element wider than `100%`.

## Staff Workflow Redesign

### Dashboard

The dashboard should answer five questions at a glance:

- What needs attention now?
- Which orders are blocked or due soon?
- Where is work concentrated in production?
- How much money is coming in or outstanding?
- What action should staff take next?

Proposed layout:

- Top command strip: title, branch/date context, seed/export/live-order actions.
- KPI grid: cash inflow, receivables, active workload, low stock, quote backlog, due-today count.
- Priority queue: due orders, stalled tasks, low stock, quote requests awaiting review.
- Production matrix: stages across measurement, cutting, stitching, trial, finishing, ready.
- Recent activity feed: compact and scannable.

Mobile dashboard:

- KPI tiles become a horizontal snap row.
- Priority queue appears first.
- Charts become summary cards with expandable details.

### Orders

- Desktop: table with sticky header, status chips, client, due date, payment state, assigned stage, row actions.
- Mobile: each order becomes a compact production card with client, garment count, due date, payment, and next action.
- Add a persistent filter/search area: status, branch, due range, payment state, assignee.

### Quote Review

- Treat quote requests as a sales intake board.
- Columns or filters: submitted, reviewed, converted, rejected.
- Mobile card actions: review, reject, convert to order once future conversion exists.

### Clients

- Split "Client Registry" and "Households" clearly.
- Search should be first-class and sticky on mobile.
- Client cards need measurement completeness, open orders, balance, and last activity.

### Inventory

- Inventory should emphasize reorder risk.
- Desktop table plus low-stock summary.
- Mobile cards grouped by critical, low, healthy.
- Roll management should be reachable as an inline secondary action.

### Accounting, Vendors, Employees, Branches

- These are admin-only and can stay denser on desktop.
- On mobile, prioritize review and approval actions over full ledger-table scanning.
- Payroll and vendor bill modals need mobile-safe heights and single-column form grids.

## Client Workflow Redesign

### Client Dashboard

Proposed hierarchy:

- Welcome/account header with quote CTA.
- Active order timeline card first.
- Quote request status card second.
- Measurement profile card third.
- Payment/balance summary if available.
- Appointment or measurement booking prompts.

Mobile:

- The quote CTA should be sticky or near top.
- Order cards should show progress as a vertical stepper rather than wide horizontal bars.

### Request Quote

- Convert the form into sections:
  - Garment intent
  - Timing and budget
  - Measurements
  - Inspiration
- Keep full-page form on desktop, single-column on mobile.
- Move all user-visible option labels and placeholders into i18n.

## Public Storefront Redesign

The storefront should be the premium first impression, but not a marketing-only page.

First viewport:

- Brand and direct business value.
- Primary CTA: Request Bespoke Quote.
- Secondary CTA: Track Existing Order.
- Actual tailoring image or reliable local fallback.
- Hint of order-tracking section below the fold.

Mobile:

- No decorative absolute cards that exceed viewport width.
- CTA buttons full width.
- Tracking input and submit button stack cleanly.

## RBAC Experience

Admin:

- Sees all staff modules.
- Can access vendors, accounting, employees, and branches.
- Dashboard includes financial/admin metrics.

Employee:

- Sees operational modules only.
- Dashboard should hide admin-only financial deep links unless rules allow them.
- Mobile bottom nav should omit admin-only routes.

Client:

- Cannot see staff shell.
- Only sees owned orders, quote requests, profile/measurement/account actions.

Unknown/unauthenticated:

- Public storefront renders without auth blocking.
- Quote request redirects through login and returns to `/client/request-quote`.

## Implementation Plan

### Phase 1: Foundation

- Create shared layout primitives in `src/components/layout`.
- Move repeated status color mappings into a shared helper.
- Centralize app-level direction handling in `AppContent`.
- Add i18n keys for new visible strings.

### Phase 2: Staff Shell

- Refactor `AdminLayout` into responsive desktop rail, tablet rail, mobile bottom nav, and `More` sheet.
- Add reusable `PageShell`, `PageHeader`, and `ActionBar`.
- Preserve existing route/RBAC logic in `src/lib/roleRouting.ts`.

### Phase 3: Staff Modules

- Start with Dashboard, Orders, Quote Review, Clients, Inventory.
- Convert table-heavy views to `DataView`: desktop table plus mobile cards.
- Keep existing Firestore data calls intact unless a behavior bug is found.

### Phase 4: Client Portal

- Redesign `/client` and `/client/request-quote` from the same primitives.
- Add mobile stepper/timeline patterns.
- Localize hardcoded strings.

### Phase 5: Storefront

- Fix mobile overflow at the root.
- Redesign hero and tracking sections with stable widths and no off-canvas absolute elements.
- Use a reliable local/asset-backed visual fallback.

### Phase 6: Verification

- Run:
  - `npm test`
  - `npm run lint`
  - `npm run build`
- Browser preview:
  - `/` at 390px, 768px, 1440px.
  - `/client` and `/client/request-quote` with a client login.
  - `/admin`, `/admin/orders`, `/admin/quotes`, `/admin/clients`, `/admin/inventory` with admin and employee logins.
- Check:
  - No horizontal overflow.
  - No clipped nav/action buttons.
  - Tables usable on mobile.
  - RTL Urdu direction does not break layout.
  - Admin-only modules hidden for employees.
  - Client-owned data remains scoped.

## Design Decision

Use the staff ERP command center as the source of truth for layout primitives, then adapt those primitives into calmer client and public compositions. This gives the whole application one system while preserving the different mental models of operators, clients, and unauthenticated visitors.
