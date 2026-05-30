# Architecture Documentation

## Technology Stack

Evidence: `package.json`, `vite.config.ts`, `src/lib/firebase.ts`.

- Language: TypeScript/TSX.
- Frontend: React 19, Vite 6, React Router 7, Tailwind CSS v4, Motion, Lucide React.
- Backend/data: Firebase Authentication and Cloud Firestore.
- Realtime: Firestore `onSnapshot`.
- Offline cache: Firestore multi-tab IndexedDB persistence.
- Charts: Recharts.
- Tests: Vitest with jsdom.
- External links/APIs: WhatsApp deep links and Unsplash image URL.

Not found in codebase:

- Custom REST API routes.
- GraphQL API.
- Queue system.
- Worker process.
- Server scheduler.
- Redis or application cache.
- CI/CD pipeline.
- Monitoring or tracing integration.

## Application Style

The system is a browser-first monolithic SPA. Routing, UI state, Firestore reads/writes, validation, and most business workflows run in the client.

Cloud Firestore functions as both persistence and API surface. Firestore Security Rules are the authoritative access-control layer.

## Major System Components

- `src/main.tsx`: React bootstrap.
- `src/App.tsx`: route map, login, admin shell, route guards.
- `src/contexts/UserContext.tsx`: Firebase auth state and profile loading/provisioning.
- `src/pages/*`: route-level surfaces.
- `src/components/*`: shared modals and UI widgets.
- `src/lib/*`: Firebase setup, domain helpers, validation, i18n, seed data, finance helpers.
- `src/hooks/useFirestoreQuery.ts`: realtime Firestore listener hook.
- `src/types.ts`: domain interfaces.
- `firestore.rules`: authorization and validation rules.
- `firebase-blueprint.json`: schema documentation.

## Architecture Observations

- The code uses a page-and-modal structure rather than controllers/services/repositories.
- Pure business helpers are gradually being extracted to `src/lib`.
- Firestore writes are mixed between one-off writes and `writeBatch`.
- Some surfaces use realtime listeners, while others use `getDocs` and manual refresh.
- Role routing is centralized, but permission flags are not fully mirrored by Firestore rules.
