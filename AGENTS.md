# AI Agent Instructions & Project Context

This file provides critical context for AI agents working on the Tailoring Empire ERP application.

## 1. Project Identity
- **Name:** Tailoring Empire ERP
- **Mission:** A high-end, bilingual (English/Urdu) Enterprise Resource Planning system for bespoke tailoring businesses.
- **Aesthetic:** High-contrast, "Intelligence" focused, bold typography (italic headings), heavy use of rounded corners (`rounded-3xl`), and a clean, professional "Swiss/Modern" feel.

## 2. Technical Stack
- **Frontend:** React 18+ (Vite), Tailwind CSS, Lucide Icons, Framer Motion (use `motion/react`).
- **Backend:** Firebase (Firestore & Authentication).
- **Internationalization:** `i18next` & `react-i18next` supporting English (`en`) and Urdu (`ur`).
- **Charts:** `recharts`.

## 3. Core Standards & Conventions

### UI/UX Standards
- **Mobile First:** All components must be responsive. Use Tailwind's `sm:`, `md:`, `lg:` prefixes diligently.
- **Bilingual Support:** 
  - NEVER hardcode strings. Use the `t()` function from `useTranslation()`.
  - Translations are stored in `src/lib/i18n.ts`.
  - The application supports RTL (Right-to-Left) automatically for Urdu.
- **Consistency:** 
  - Headings should use `font-black text-slate-900 tracking-tight italic uppercase`.
  - Subheadings/Labels should use `text-[10px] font-black text-slate-400 uppercase tracking-widest`.
  - Containers should generally use `bg-white rounded-[2.5rem] border border-slate-200 shadow-sm`.

### Data & State
- **Types:** Centralized in `src/types.ts`. Any new entity must be defined there first.
- **Firebase Blueprint:** `firebase-blueprint.json` tracks the collection structures for security rules and IR documentation.
- **Error Handling:** Always use the `handleFirestoreError` utility from `src/lib/firebase` when performing Firestore operations.
- **User Context:** Access user data, profile, and roles (Admin/Employee/Client) via the `useUser()` hook in `src/contexts/UserContext`.

## 4. Application Flow
1. **Authentication:** Google Login via `signInWithPopup`.
2. **Onboarding:** New users default to the 'Client' role. Roles must be upgraded manually in the database or via specific flows if implemented.
3. **Dashboard:** The central "Intelligence" hub. Quick actions should link to relevant modules (Inventory, Clients, etc.).
4. **Profile Management:**
   - Clients/Admins can edit directly.
   - Employees submit "Profile Requests" which must be approved by an Admin (stored in `profileRequests` collection).
5. **Orders/Workflows:** Orders flow through various stages (Measurement -> Cutting -> Stitching -> Finishing -> Delivery).

## 5. Security Rules
- All Writes must be validated via `isValid[Entity]` helpers in `firestore.rules`.
- Admin roles are checked via `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`.
