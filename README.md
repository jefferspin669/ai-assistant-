# Atlas AI — Your AI Workforce

> Everyone deserves an AI employee.

Atlas is an ecosystem of AI helpers for:

- Individuals & families
- Event organizers
- Small businesses *(launch beachhead)*
- Nonprofits & schools

## Beachhead

Start with small service businesses that need an AI receptionist and scheduling. Expand into personal assistants and celebration/event planning on the same platform.

## Platform pillars

- **Intelligence Network** (`/app/network`) — anonymized industry trends across thousands of businesses
- **AI Digital Employees** (`/app/digital-employees`) — CEO, CFO, Marketing, Sales, Support, Ops, HR, IT, Compliance, Supply Chain
- **Business DNA** (`/app/dna`) — company voice, discounts, escalation rules, pricing philosophy

## Atlas Brain

The central AI that remembers customers, employees, hours, services, inventory, appointments, conversations, policies, pricing, documents, past jobs, equipment, and suppliers — so every AI doesn’t start over.

## Run

```bash
npm install
npm run dev
```

- Marketing: `/`
- Choose audience: `/onboarding`
- Command center: `/app`
- Intelligence Network: `/app/network`
- Business DNA: `/app/dna`
- Digital Employees: `/app/digital-employees`
- Marketplace / App Store / API: `/app/marketplace`, `/app/app-store`, `/app/developers`

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
