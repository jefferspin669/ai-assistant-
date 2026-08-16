# Atlas AI

Next.js 15 (App Router) + React 19 + TypeScript.

## Honest status

Atlas has a large interactive product surface. Much of it is still a **sophisticated simulation**:

- Keyword Brain fallback in `src/lib/commands.ts`
- File-backed JSON under `.data/` (not shared Postgres yet)
- Many studios mock phone/calendar/invoices

**North star:** stop adding feature pages; make one beachhead real. See `docs/NORTH_STAR.md`.

## Atlas Brain (Phase 0)

- Command Center talks to `POST /api/ai/chat`
- If `ATLAS_LLM_API_KEY` is set → live OpenAI-compatible LLM + tool calling
- If unset → simulation/keyword fallback (demos still work)
- Tools: business brief, propose risky action (approval), remember standing order
- Postgres schema draft: `supabase/schema.sql`

## Backend today

- Route Handlers under `src/app/api/**`
- Architecture DB → `.data/atlas-db.json`
- Workspace domains → `.data/workspace.json`
- Open `/app/backend` for health checks

## Cursor Cloud specific instructions

- Package manager is npm (`package-lock.json`); Node 20+ works (verified on Node 22).
- Standard scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm start`. Setup: `npm install`.
- Dev server: `http://localhost:3000` via `npm run dev`.
- Optional env: copy `.env.example` → `.env.local` and set `ATLAS_LLM_API_KEY` for live Brain.
- Interactive hello world: open `/app`, Talk to Atlas. Try “How is business?” or “Going home — handle tonight”.
- Backend smoke: `curl http://localhost:3000/api/health` or `curl -X POST http://localhost:3000/api/ai/chat -H 'content-type: application/json' -d '{"message":"How is business?"}'`.
- Do **not** prioritize new `/app/*` feature studios over Brain / Postgres / receptionist work.
