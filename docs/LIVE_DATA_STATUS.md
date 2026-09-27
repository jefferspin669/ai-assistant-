# Live data status

## Implemented in this pass

- Projects and Tasks use the authenticated, organization-scoped server APIs. Task assignments and status changes are persisted and checked by server permissions.
- Customers use the authenticated customer API instead of a separate browser-only CRM store.
- Empty new workspaces no longer receive sample organizations, users, projects, or transactions at startup. Local development can opt in with `ATLAS_SEED_DEMO=1`; production never opts in. This change does not delete records already stored in existing workspaces.
- The simulated analytics answer page now routes to the real Dashboard. The sample Atlas Brain presentation now routes to the Assistant; Business DNA routes to Memory; Knowledge routes to Files.
- The missed-calls and call-summaries pages show setup requirements instead of fabricated calls, summaries, uploads, and delivery confirmations.
- Invited workers no longer receive a shared default password. Invitation delivery and password setup still need a full end-to-end implementation before inviting paying customers.
- Worker team snapshots do not include the business approval queue or audit feed.

## Still unfinished

This is not a claim that every Atlas page is backed by live records. Many of the remaining Studio screens still use local browser storage, hard-coded examples, simulated provider results, or unsupported actions. A source scan finds more than 50 application/component files containing sample or demo language; this count includes honest labels and is not a count of discrete features.

Before selling access, audit every navigation destination, retire or connect each unfinished workflow, and verify permissions with two separate businesses. Provision PostgreSQL, configure and verify external services, add a complete worker invitation/password setup flow, and run a real staging transaction including approvals, webhooks, retries, monitoring, and backup restoration. A static GitHub Pages export cannot run authenticated Atlas API routes.
