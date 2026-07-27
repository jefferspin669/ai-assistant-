# Atlas AI — Your AI Workforce

> Everyone deserves an AI employee.

Atlas is an ecosystem of AI helpers for:

- Individuals & families
- Event organizers
- Small businesses *(launch beachhead)*
- Nonprofits & schools

## Beachhead

Start with small service businesses that need an AI receptionist and scheduling. Expand into personal assistants and celebration/event planning on the same platform.

## Atlas Brain

The central AI that remembers customers, employees, hours, services, inventory, appointments, conversations, policies, pricing, documents, past jobs, equipment, and suppliers — so every AI doesn’t start over.

## Run

```bash
npm install
npm run dev
```

- Marketing: `/`
- Choose audience: `/onboarding`
<<<<<<< HEAD
- Command center: `/app`
- Atlas Brain: `/app/brain`
- AI Memory: `/app/memory`
- Knowledge Base: `/app/knowledge`
- Phone System: `/app/phone`
- Intelligence Score: `/app/score`
- Workflow Builder: `/app/workflows`
- Marketplace / App Store / API: `/app/marketplace`, `/app/app-store`, `/app/developers`
=======
- Business Atlas: `/app`
- Workforce overview: `/app/workforce`
- Personal AI: `/app/personal`
- Event AI: `/app/events`
- Team AI: `/app/employees`
- Marketplace: `/app/marketplace`
- Industry Packs: `/app/industries`

## Runtime security

Production (`npm run start`) locks `/app` until you set a password:

```bash
cp .env.example .env.local
# set ATLAS_APP_PASSWORD to a long random secret
npm run build && npm run start
```

Browser Basic Auth username defaults to `atlas` (override with `ATLAS_APP_USER`). Marketing routes stay public. Every response gets CSP, clickjacking, MIME sniffing, and related hardening headers.

For a machine-local demo only, bind the host so the server is not reachable from other devices:

```bash
npm run start -- -H 127.0.0.1
```
>>>>>>> origin/main
