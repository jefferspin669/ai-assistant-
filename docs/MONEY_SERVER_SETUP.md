# Money and server setup

## Run Atlas with a database

1. Use Node.js 20+, run `npm install`, and copy `.env.example` to `.env.local`.
2. Start a PostgreSQL and Redis service. For a local trial run `docker compose up -d postgres redis`.
3. Set `DATABASE_URL` and `REDIS_URL` to those services. Run `npm run db:migrate`, then `npm run worker` and `npm run dev` in separate terminals.
4. Check `/api/health` and `/app/backend`: PostgreSQL must report connected, and the queue/worker must be running before treating Atlas as a live service. If a configured PostgreSQL database goes down, Atlas must fail the request rather than accept writes into temporary memory; health reports degraded.
5. For customers, deploy this **Next.js server**, worker, PostgreSQL, HTTPS and backups. GitHub Pages serves static pages only. Never publish `.env.local` or server secrets. `ATLAS_ENV=production` refuses to start without `DATABASE_URL`.

## Connect a bank

Configure `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from the same Stripe account, and enable Financial Connections in that account. Open Banking under Money and choose **Connect bank securely**. Stripe collects bank login details; Atlas stores a per-workspace Stripe session reference and displays linked accounts and provider-reported balances. Test mode is marked as test. Owners can disconnect an account to revoke Atlas's provider access. A bank connection grants read access only: it does not transfer funds, deposit money, or automatically reconcile bank transactions.

## Send an invoice

Configure Stripe invoicing, customer payment methods, and `STRIPE_WEBHOOK_SECRET`; configure its endpoint to `https://YOUR_DOMAIN/api/webhooks/stripe` and subscribe to `invoice.paid`. Enter the customer email, amount and description in Invoices & payments. Stage, approve in Approvals, then return to Invoices & payments to send the approved draft. Approval alone does not send it. Stripe sends the hosted invoice. Atlas records money received only after the signed payment event identifies a matching workspace invoice and the paid amount matches the approved invoice. Check Stripe's dashboard when a send attempt fails before retrying. Your own payout bank details belong in Stripe's secured payout settings, not an Atlas form.

## Taxes

Recording income or expenses updates the Tax summary instantly on that page and refreshes it periodically. Atlas reports annual recorded income, expenses and net activity from the same organization ledger; demo entries and unpaid invoices are excluded. It does **not** calculate tax owed, identify deductible expenses, handle sales tax, or file a return. Those require verified jurisdiction, entity and filing details, tax law, and professional review. Bank transactions are not imported automatically yet.

Before accepting paying customers, verify two separate businesses, Stripe test and live events, a full invoice settlement, database backup restoration, and end-to-end bank reconnection in staging. These checks cannot be completed from source code alone.
