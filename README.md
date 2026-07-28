# Atlas AI — Intelligent Workforce for Every Business

> **Every business deserves an intelligent workforce, regardless of its size.**

Don’t just sell software. Build around a mission. Atlas exists so companies of any size — not only enterprises with huge budgets — can run with digital employees, shared memory, and judgment.

## Beachhead

Start with small service businesses that need an AI receptionist and scheduling. Expand into personal assistants and celebration/event planning on the same platform. The beachhead proves the mission where the gap hurts most.

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
- **Business Command Language** (`/app/command-language`) — plain English → automations
- **AI Trust & Governance** (`/app/governance`) — approvals, audit logs, RBAC, retention, compliance reports
- **Customer Digital Twin** (`/app/customer-twin`) — living customer profiles for personalized interactions
- **Atlas Mission** (`/app/mission`) — every business deserves an intelligent workforce, regardless of size
- **Tax Center** (`/app/tax`) — automatic income tracking and receipt-based expense deductions with Needs Review

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
- Business Command Language: `/app/command-language`
- AI Trust & Governance: `/app/governance`
- Customer Digital Twin: `/app/customer-twin`
- Atlas Mission: `/app/mission`
- Tax Center: `/app/tax`
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
