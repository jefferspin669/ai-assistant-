# Atlas AI

Frontend-only Next.js 15 (App Router) + React 19 + TypeScript prototype of an "AI workforce" platform. There is no backend, database, or external API — all data is mocked in `src/lib/data.ts` and chat replies are keyword-matched in `src/lib/commands.ts` (and per-page `reply()` handlers).

## Cursor Cloud specific instructions

- Package manager is npm (`package-lock.json`); Node 20+ works (verified on Node 22).
- Standard scripts live in `package.json`: `npm run dev`, `npm run build`, `npm run lint`, `npm start`. Setup is just `npm install`.
- Dev server runs on `http://localhost:3000`. Start it with `npm run dev` (do not use `npm run build`/`npm start` for development).
- No env vars, secrets, or services are required. State is client-side only, so a page refresh resets everything.
- Interactive "hello world": open `/app` and use the "Talk to Atlas" Command Center. Try "How is business?" then "Approve the Johnson Construction estimate." to trigger the confirm → success flow. Commands are keyword-matched (see `src/lib/commands.ts`), not a real LLM.
- The marketing hero image loads from `images.unsplash.com`; if egress is blocked the image is broken but the app is otherwise fully functional.
