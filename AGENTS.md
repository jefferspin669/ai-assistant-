# Atlas AI

Next.js 15 (App Router) + React 19 + TypeScript prototype of an "AI workforce" platform.

## Backend

- Next.js Route Handlers under `src/app/api/**` (auth, calendar, tasks, transactions, taxes, AI, files, workspace, health).
- Architecture database persists to `.data/atlas-db.json` on the server (and `localStorage` when APIs run in the browser).
- Product workspace domains (tasks, tax, calendar, connections, confirmations, feedback, …) sync via `/api/workspace/:domain` into `.data/workspace.json`.
- Keyword chat replies still live in `src/lib/commands.ts` (not a real LLM).
- Open `/app/backend` for live health checks against the file-backed API.

## Cursor Cloud specific instructions

- Package manager is npm (`package-lock.json`); Node 20+ works (verified on Node 22).
- Standard scripts live in `package.json`: `npm run dev`, `npm run build`, `npm run lint`, `npm start`. Setup is just `npm install`.
- Dev server runs on `http://localhost:3000`. Start it with `npm run dev` (do not use `npm run build`/`npm start` for development).
- No env vars, secrets, or external services are required. `.data/` is created automatically and is gitignored.
- Interactive "hello world": open `/app` and use the "Talk to Atlas" Command Center. Try "How is business?" then "Approve the Johnson Construction estimate." to trigger the confirm → success flow.
- Backend smoke: open `/app/backend`, or `curl http://localhost:3000/api/health`.
- The marketing hero image loads from `images.unsplash.com`; if egress is blocked the image is broken but the app is otherwise fully functional.
