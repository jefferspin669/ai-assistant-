# Atlas AI

Next.js 15 (App Router) + React 19 + TypeScript prototype of an "AI workforce" platform. The main sidebar is compact (Home, Ask Atlas, Work, Business, AI, More). Depth features live inside section hubs. Dashboard and chat must label DEMO vs LIVE data.

API identity comes from the `atlas_session` httpOnly cookie — never from body `userId` / `organizationId`. Customers, tasks, calendar, and transactions are org-scoped in the server JSON store (`.data/atlas-db.json`). Home KPIs and Ask Atlas still mix LIVE API data with DEMO pulse/localStorage in some UI surfaces. Auth extras (reset, MFA, lockout) exist as prototype routes, not production email/TOTP providers.

## Cursor Cloud specific instructions

- Package manager is npm (`package-lock.json`); Node 20+ works (verified on Node 22). After pulling, run `npm install` so `zod` and `vitest` are present.
- Standard scripts live in `package.json`: `npm run dev`, `npm run build`, `npm run lint`, `npm start`, `npm test`. Setup is just `npm install`.
- Dev server runs on `http://localhost:3000`. Start it with `npm run dev` (do not use `npm run build`/`npm start` for development).
- No env vars are required in development. Production needs `ATLAS_APP_PASSWORD` (16+ chars) if env validation is used.
- Interactive "hello world": open `/app`. Confirm KPI badges say DEMO or LIVE honestly. Try Ask Atlas: "How did we do this week?" then "Move John's 2 PM appointment to tomorrow."
- The marketing hero image loads from `images.unsplash.com`; if egress is blocked the image is broken but the app is otherwise fully functional.
- Seed login (after `resetDatabase`): `demo@atlas.ai` / `atlas-demo`. Dev `GET /api/session` mints a cookie for the seeded owner.
