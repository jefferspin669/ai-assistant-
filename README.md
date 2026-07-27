# Atlas AI — Your AI Workforce

> Everyone deserves an AI employee.

Atlas is an ecosystem of AI helpers for:

- Individuals & families
- Event organizers
- Small businesses *(launch beachhead)*
- Nonprofits & schools

## Beachhead

Start with small service businesses that need an AI receptionist and scheduling. Expand into personal assistants and celebration/event planning on the same platform.

## Run

```bash
npm install
npm run dev
```

- Marketing: `/`
- Choose audience: `/onboarding`
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
