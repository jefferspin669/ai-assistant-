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
- **AI Digital Employees** (`/app/digital-employees`) — CEO through Supply Chain specialists
- **Business DNA** (`/app/dna`) — company voice, discounts, escalation rules, pricing philosophy
- **Autonomous Mode** (`/app/autonomous`) — continuous loops; owner gets confirmations
- **Business Simulator** (`/app/simulator`) — what-if modeling for wages, costs, demand, cash
- **AI Operating System** (`/app/os`) — one workspace for email, phone, CRM, money, marketing, and more
- **Atlas Academy** (`/app/training`) — lessons, role-play, certifications, tests, voice practice
- **Business Builder** (`/app/builder`) — help create a company from name to first customers
- **Executive Memory** (`/app/ceo-memory`) — years of decisions with context and meeting notes
- **AI Risk Center** (`/app/risk`) — warn before satisfaction, burnout, cash, and compliance problems get expensive
- **AI Marketplace** (`/app/marketplace`) — developers publish agents, dashboards, automations, reports, integrations, templates; businesses install
- **Global Business Memory** (`/app/global-memory`) — languages, time zones, tax, hours, holidays, currency, local regulations
- **Explainable AI** (`/app/explainable`) — recommendations with why, data, risks, outcomes, confidence, and alternatives

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
- Autonomous Mode: `/app/autonomous`
- Business Simulator: `/app/simulator`
- AI Operating System: `/app/os`
- Atlas Academy: `/app/training`
- Business Builder: `/app/builder`
- Executive Memory: `/app/ceo-memory`
- AI Risk Center: `/app/risk`
- AI Marketplace: `/app/marketplace`
- Global Business Memory: `/app/global-memory`
- Explainable AI: `/app/explainable`
- App Store / API: `/app/app-store`, `/app/developers`

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
