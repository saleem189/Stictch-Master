# Coding Standards Audit

## Standards Currently Used

- TypeScript domain interfaces in `src/types.ts`.
- Page modules in `src/pages`.
- Shared UI/components in `src/components`.
- Business helpers in `src/lib`.
- Firestore access mostly in page/component modules.
- `handleFirestoreError()` used for many Firestore operations.
- Tests are helper-level Vitest tests.
- Styling is Tailwind utility-first.
- Icons are Lucide React.

## Naming and Organization

The app generally uses PascalCase components and camelCase helpers. Collections mostly map directly to TypeScript entities.

## Error Handling

Common pattern:

- `try/catch`
- `handleFirestoreError(error, OperationType.X, path)`
- Toast messages in UI flows

Inconsistencies:

- Some components only `console.error`.
- `handleFirestoreError` throws after logging, which can surface raw serialized error data.

## Testing Pattern

Covered:

- Helper functions.
- Role routing.
- Quote validation.
- Ledger calculations.
- Notification normalization.
- Offline persistence helper.

Missing:

- Component tests.
- Firestore emulator tests.
- End-to-end authenticated workflow tests.
- Accessibility tests.

## Code Quality Assessment

Maintainability is moderate to good for a prototype. Risk increases in modules where Firestore operations, form state, business rules, and UI are all inside one large component.

Main improvement opportunities:

- Extract high-risk Firestore workflows into service functions.
- Add stronger tests around those service functions.
- Normalize i18n.
- Add route splitting and pagination.
