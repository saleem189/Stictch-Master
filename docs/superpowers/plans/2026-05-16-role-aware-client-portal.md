# Role-Aware Client Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build role-aware post-login routing plus a client-facing dashboard and bespoke quote request flow.

**Architecture:** Add small routing helpers, a `QuoteRequest` domain type, client-only pages, and Firestore rules for client-owned quote requests. Keep admin quote management and quote-to-order conversion out of this slice.

**Tech Stack:** React, React Router, Firebase Auth, Cloud Firestore, Tailwind CSS v4, i18next, Vitest.

---

## File Structure

- Modify `src/types.ts`: add `QuoteRequest`, `QuoteRequestStatus`, and `MeasurementSource` types.
- Create `src/lib/roleRouting.ts`: pure helpers for deciding role landing routes and route access.
- Create `src/lib/quoteRequests.ts`: validation/default helpers for quote request form data.
- Create `src/lib/roleRouting.test.ts`: unit tests for role landing behavior.
- Create `src/lib/quoteRequests.test.ts`: unit tests for quote validation.
- Modify `src/App.tsx`: wire `/client`, `/client/request-quote`, and shared login redirect behavior.
- Create `src/pages/ClientDashboard.tsx`: client account dashboard with order and quote overview.
- Create `src/pages/RequestQuote.tsx`: bespoke quote request form.
- Modify `src/pages/Home.tsx`: make public CTAs point clients toward login/client quote flow.
- Modify `src/lib/i18n.ts`: add strings introduced by new client pages.
- Modify `firestore.rules`: add `quoteRequests` rules.
- Modify `firebase-blueprint.json`: document the new collection if structure allows direct collection entries.

---

### Task 1: Role Routing Helper

**Files:**
- Create: `src/lib/roleRouting.ts`
- Test: `src/lib/roleRouting.test.ts`
- Modify: `src/types.ts`

- [ ] **Step 1: Add tests for role landing routes**

Create `src/lib/roleRouting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getRoleLandingPath, canAccessAdminRoutes, canAccessClientRoutes } from './roleRouting';

describe('role routing', () => {
  it('routes admins and employees to admin', () => {
    expect(getRoleLandingPath('admin')).toBe('/admin');
    expect(getRoleLandingPath('employee')).toBe('/admin');
  });

  it('routes clients to the client portal', () => {
    expect(getRoleLandingPath('client')).toBe('/client');
  });

  it('falls back to the public homepage when role is unknown', () => {
    expect(getRoleLandingPath(undefined)).toBe('/');
  });

  it('protects admin routes from clients', () => {
    expect(canAccessAdminRoutes('admin')).toBe(true);
    expect(canAccessAdminRoutes('employee')).toBe(true);
    expect(canAccessAdminRoutes('client')).toBe(false);
  });

  it('protects client routes from staff roles', () => {
    expect(canAccessClientRoutes('client')).toBe(true);
    expect(canAccessClientRoutes('admin')).toBe(false);
    expect(canAccessClientRoutes('employee')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\vitest\vitest.mjs run src/lib/roleRouting.test.ts
```

Expected: fail because `src/lib/roleRouting.ts` does not exist.

- [ ] **Step 3: Implement routing helper**

Create `src/lib/roleRouting.ts`:

```ts
import { UserRole } from '../types';

export function getRoleLandingPath(role?: UserRole | null): string {
  if (role === 'admin' || role === 'employee') return '/admin';
  if (role === 'client') return '/client';
  return '/';
}

export function canAccessAdminRoutes(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'employee';
}

export function canAccessClientRoutes(role?: UserRole | null): boolean {
  return role === 'client';
}
```

- [ ] **Step 4: Run the test**

Run:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\vitest\vitest.mjs run src/lib/roleRouting.test.ts
```

Expected: pass.

---

### Task 2: Quote Request Domain Helpers

**Files:**
- Modify: `src/types.ts`
- Create: `src/lib/quoteRequests.ts`
- Test: `src/lib/quoteRequests.test.ts`

- [ ] **Step 1: Add quote request types**

Add to `src/types.ts` after `ProfileRequest`:

```ts
export type QuoteRequestStatus = 'submitted' | 'reviewed' | 'converted' | 'rejected';

export type MeasurementSource = 'existing' | 'book-measurement' | 'enter-later';

export interface QuoteRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  garmentType: string;
  styleNotes: string;
  preferredDueDate: string;
  budgetRange: string;
  measurementSource: MeasurementSource;
  inspirationNotes?: string;
  status: QuoteRequestStatus;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Add validation tests**

Create `src/lib/quoteRequests.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getInitialQuoteRequestForm, validateQuoteRequestForm } from './quoteRequests';

describe('quote request helpers', () => {
  it('creates a safe initial form', () => {
    expect(getInitialQuoteRequestForm()).toEqual({
      garmentType: '',
      styleNotes: '',
      preferredDueDate: '',
      budgetRange: '',
      measurementSource: 'book-measurement',
      inspirationNotes: '',
    });
  });

  it('requires core bespoke quote fields', () => {
    const result = validateQuoteRequestForm(getInitialQuoteRequestForm());

    expect(result.valid).toBe(false);
    expect(result.errors.garmentType).toBe('Garment type is required');
    expect(result.errors.styleNotes).toBe('Style notes are required');
    expect(result.errors.preferredDueDate).toBe('Preferred due date is required');
    expect(result.errors.budgetRange).toBe('Budget range is required');
  });

  it('accepts a complete quote request form', () => {
    const result = validateQuoteRequestForm({
      garmentType: 'Sherwani',
      styleNotes: 'Ivory, formal wedding wear',
      preferredDueDate: '2026-06-20',
      budgetRange: '50000-100000',
      measurementSource: 'existing',
      inspirationNotes: '',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });
});
```

- [ ] **Step 3: Run the failing test**

Run:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\vitest\vitest.mjs run src/lib/quoteRequests.test.ts
```

Expected: fail because `quoteRequests.ts` does not exist.

- [ ] **Step 4: Implement quote request helper**

Create `src/lib/quoteRequests.ts`:

```ts
import { MeasurementSource } from '../types';

export interface QuoteRequestFormData {
  garmentType: string;
  styleNotes: string;
  preferredDueDate: string;
  budgetRange: string;
  measurementSource: MeasurementSource;
  inspirationNotes: string;
}

export type QuoteRequestFormErrors = Partial<Record<keyof QuoteRequestFormData, string>>;

export function getInitialQuoteRequestForm(): QuoteRequestFormData {
  return {
    garmentType: '',
    styleNotes: '',
    preferredDueDate: '',
    budgetRange: '',
    measurementSource: 'book-measurement',
    inspirationNotes: '',
  };
}

export function validateQuoteRequestForm(form: QuoteRequestFormData): { valid: boolean; errors: QuoteRequestFormErrors } {
  const errors: QuoteRequestFormErrors = {};

  if (!form.garmentType.trim()) errors.garmentType = 'Garment type is required';
  if (!form.styleNotes.trim()) errors.styleNotes = 'Style notes are required';
  if (!form.preferredDueDate) errors.preferredDueDate = 'Preferred due date is required';
  if (!form.budgetRange.trim()) errors.budgetRange = 'Budget range is required';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
```

- [ ] **Step 5: Run the tests**

Run:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\vitest\vitest.mjs run src/lib/quoteRequests.test.ts
```

Expected: pass.

---

### Task 3: Wire Role-Aware Routes

**Files:**
- Modify: `src/App.tsx`
- Create: `src/pages/ClientDashboard.tsx`
- Create: `src/pages/RequestQuote.tsx`

- [ ] **Step 1: Add placeholder client pages**

Create `src/pages/ClientDashboard.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

export default function ClientDashboard() {
  const { user, profile } = useUser();

  return (
    <main className="min-h-[100dvh] bg-slate-50 text-slate-900">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <Scissors size={20} />
            </div>
            <span className="text-xl font-black tracking-tight">STITCH<span className="text-indigo-600">MASTER</span></span>
          </Link>
          <Link to="/client/request-quote" className="rounded-2xl bg-slate-950 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white">
            Request Quote
          </Link>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client Portal</p>
          <h1 className="mt-3 text-4xl font-black uppercase italic tracking-tight text-slate-900">
            Welcome, {profile?.name || user?.displayName || 'Client'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Track your bespoke work, manage quote requests, and keep measurements ready for your next garment.
          </p>
        </div>
      </section>
    </main>
  );
}
```

Create `src/pages/RequestQuote.tsx`:

```tsx
import { Link } from 'react-router-dom';

export default function RequestQuote() {
  return (
    <main className="min-h-[100dvh] bg-slate-50 px-4 py-10 text-slate-900 sm:px-8">
      <section className="mx-auto max-w-3xl rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
        <Link to="/client" className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
          Back to portal
        </Link>
        <h1 className="mt-6 text-4xl font-black uppercase italic tracking-tight">Request Bespoke Quote</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
          Tell us what you want made. Our workshop will review measurements, fabric, and timing before creating a final order.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Update `App.tsx` imports and route guards**

In `src/App.tsx`, import:

```ts
import ClientDashboard from './pages/ClientDashboard';
import RequestQuote from './pages/RequestQuote';
import { canAccessAdminRoutes, canAccessClientRoutes, getRoleLandingPath } from './lib/roleRouting';
```

In `AppContent`, derive:

```ts
const role = profile?.role;
const landingPath = getRoleLandingPath(role);
```

Change `/login` to:

```tsx
<Route path="/login" element={!user ? <Login /> : <Navigate to={landingPath} />} />
```

Add client routes before admin routes:

```tsx
<Route path="/client" element={
  user && canAccessClientRoutes(role) ? <ClientDashboard /> : user ? <Navigate to={landingPath} /> : <Navigate to="/login" />
} />
<Route path="/client/request-quote" element={
  user && canAccessClientRoutes(role) ? <RequestQuote /> : user ? <Navigate to={landingPath} /> : <Navigate to="/login" />
} />
```

Change `/admin/*` condition to:

```tsx
user && canAccessAdminRoutes(role) ? (
```

- [ ] **Step 3: Run TypeScript**

Run:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\typescript\bin\tsc --noEmit
```

Expected: pass.

---

### Task 4: Build Client Dashboard Data

**Files:**
- Modify: `src/pages/ClientDashboard.tsx`

- [ ] **Step 1: Fetch client-owned orders and quote requests**

Replace the placeholder dashboard with a component that:

- Uses `useEffect`.
- Queries `orders` where `clientId == user.uid`.
- Queries `quoteRequests` where `clientId == user.uid`.
- Uses `handleFirestoreError(e, OperationType.GET, 'client-dashboard')`.
- Shows loading, empty, and populated states.

Expected UI sections:

- Account summary.
- Active bespoke orders.
- Quote requests.
- Measurements panel.

- [ ] **Step 2: Run TypeScript**

Run:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\typescript\bin\tsc --noEmit
```

Expected: pass.

---

### Task 5: Build Quote Request Form

**Files:**
- Modify: `src/pages/RequestQuote.tsx`

- [ ] **Step 1: Implement form using `quoteRequests` helper**

Update `RequestQuote.tsx` to:

- Use `getInitialQuoteRequestForm`.
- Use `validateQuoteRequestForm`.
- Show field-level red validation messages.
- Write to `quoteRequests` with `addDoc(collection(db, 'quoteRequests'), payload)`.
- Include `clientId`, `clientName`, `clientEmail`, `status: 'submitted'`, `createdAt`, and `updatedAt`.
- Use `handleFirestoreError(e, OperationType.WRITE, 'quoteRequests')`.
- Show success toast and navigate back to `/client`.

- [ ] **Step 2: Run quote tests and TypeScript**

Run:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\vitest\vitest.mjs run src/lib/quoteRequests.test.ts
& 'C:\Program Files\nodejs\node.exe' .\node_modules\typescript\bin\tsc --noEmit
```

Expected: both pass.

---

### Task 6: Firestore Rules and Blueprint

**Files:**
- Modify: `firestore.rules`
- Modify: `firebase-blueprint.json`

- [ ] **Step 1: Add quote request rules**

Add to `firestore.rules`:

```js
function isValidQuoteRequest(data) {
  return data.clientId is string &&
         data.clientId == request.auth.uid &&
         data.garmentType is string &&
         data.garmentType.size() > 0 &&
         data.styleNotes is string &&
         data.styleNotes.size() > 0 &&
         data.preferredDueDate is string &&
         data.budgetRange is string &&
         data.measurementSource in ['existing', 'book-measurement', 'enter-later'] &&
         data.status == 'submitted';
}

match /quoteRequests/{requestId} {
  allow create: if isSignedIn() && isValidQuoteRequest(incoming());
  allow read: if isSignedIn() && (resource.data.clientId == request.auth.uid || isEmployee());
  allow update: if isEmployee() &&
                incoming().diff(existing()).affectedKeys().hasOnly(['status', 'updatedAt', 'reviewedBy', 'reviewNotes']);
}
```

- [ ] **Step 2: Add `quoteRequests` to blueprint**

Add a collection entry matching the existing `firebase-blueprint.json` style. Include the fields from the design spec.

- [ ] **Step 3: Run build checks**

Run:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\vite\bin\vite.js build
```

Expected: pass with only existing bundle-size warnings.

---

### Task 7: Public Homepage CTAs and i18n

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/lib/i18n.ts`

- [ ] **Step 1: Update public navigation and CTAs**

Change homepage CTAs so:

- Primary CTA says `Request Bespoke Quote` and links to `/client/request-quote`.
- Secondary CTA keeps order tracking.
- Admin console link remains available but visually secondary to client journey.

- [ ] **Step 2: Add i18n keys**

Add English and Urdu keys for:

- `Client Portal`
- `Request Bespoke Quote`
- `Track Existing Order`
- `Active Orders`
- `Quote Requests`
- `Measurements`
- `Garment Type`
- `Style Notes`
- `Preferred Due Date`
- `Budget Range`
- `Measurement Source`
- `Inspiration Notes`
- `Submit Quote Request`
- `Quote request submitted`

- [ ] **Step 3: Run lint and TypeScript**

Run:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\eslint\bin\eslint.js .
& 'C:\Program Files\nodejs\node.exe' .\node_modules\typescript\bin\tsc --noEmit
```

Expected: both pass.

---

### Task 8: Final Verification

**Files:**
- Verify all touched files.

- [ ] **Step 1: Run full unit tests**

Run:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\vitest\vitest.mjs run
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run:

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\vite\bin\vite.js build
```

Expected: build passes with existing bundle warning only.

- [ ] **Step 3: Browser QA if tooling is available**

Open `http://localhost:3000` and verify:

- Public homepage renders.
- Login redirects admin/employee to `/admin`.
- Login redirects client to `/client`.
- Direct client route redirects anonymous users to `/login`.
- Direct admin route redirects client users away from `/admin`.
- Quote form validates required fields.
- Successful quote request returns to `/client`.

If Browser/Playwright is unavailable, record that limitation in the final report.
