import { readJsonFile, writeJsonFile } from "@/lib/db/file-persist";

/** Stripe customer ids keyed by Atlas organization — not a shared default customer. */
export type StripeOrgAccount = {
  organizationId: string;
  customerId?: string;
  subscriptionId?: string;
  priceId?: string;
  updatedAt: string;
};

type Store = { accounts: StripeOrgAccount[] };

function load(): Store {
  return readJsonFile<Store>("stripe-accounts.json") || { accounts: [] };
}

function save(store: Store) {
  writeJsonFile("stripe-accounts.json", store);
}

export function stripeAccountForOrg(organizationId: string): StripeOrgAccount | null {
  return load().accounts.find((row) => row.organizationId === organizationId) || null;
}

export function bindStripeAccount(
  organizationId: string,
  patch: Partial<Omit<StripeOrgAccount, "organizationId">>,
): StripeOrgAccount {
  const store = load();
  const current = store.accounts.find((row) => row.organizationId === organizationId);
  const next: StripeOrgAccount = {
    organizationId,
    customerId: patch.customerId ?? current?.customerId,
    subscriptionId: patch.subscriptionId ?? current?.subscriptionId,
    priceId: patch.priceId ?? current?.priceId,
    updatedAt: new Date().toISOString(),
  };
  store.accounts = [next, ...store.accounts.filter((row) => row.organizationId !== organizationId)];
  save(store);
  return next;
}

export function resetStripeAccountsForTests() {
  save({ accounts: [] });
}
