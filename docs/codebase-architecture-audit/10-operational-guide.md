# Operational Guide

## Local Development

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run lint/type check:

```bash
npm run lint
```

Build:

```bash
npm run build
```

## Windows Codex Node Fallback

```powershell
& 'C:\Program Files\nodejs\node.exe' .\node_modules\vitest\vitest.mjs run
& 'C:\Program Files\nodejs\node.exe' .\node_modules\typescript\bin\tsc --noEmit
& 'C:\Program Files\nodejs\node.exe' .\node_modules\eslint\bin\eslint.js .
& 'C:\Program Files\nodejs\node.exe' .\node_modules\vite\bin\vite.js build
```

## Configuration

- Firebase client config: `firebase-applet-config.json`
- Environment example: `.env.example`
- Firestore rules: `firestore.rules`
- Schema docs: `firebase-blueprint.json`

## Deployment

Not found in codebase:

- Deployment scripts.
- CI/CD workflow.
- Hosting config.
- Firebase deploy command documentation.

## Monitoring and Logging

Found:

- Browser console logging.
- Toast notifications.

Not found in codebase:

- Sentry.
- OpenTelemetry.
- Cloud logging integration.
- Health checks.

## Troubleshooting

Common known issues:

- Public order tracking can fail with Firestore permission errors.
- Google login can fail on unauthorized domains; message is handled in `App.tsx`.
- Firestore offline persistence may be unavailable in unsupported browsers or conflict across tabs.

## Disaster Recovery

Not found in codebase:

- Backup process.
- Restore process.
- Export automation.
- Incident runbook.
