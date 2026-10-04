-- Optional autonomous time window on tenant policy (additive; safe IF NOT EXISTS).
ALTER TABLE autonomy_policies ADD COLUMN IF NOT EXISTS active_from text;
ALTER TABLE autonomy_policies ADD COLUMN IF NOT EXISTS active_until text;
