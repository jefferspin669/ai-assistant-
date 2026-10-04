ALTER TABLE autonomy_policies ADD COLUMN IF NOT EXISTS control_mode text;
ALTER TABLE autonomy_policies ADD COLUMN IF NOT EXISTS auto_permissions jsonb;
-- Existing records keep their prior level meaning, but require the owner to
-- explicitly enable action categories after upgrade.
UPDATE autonomy_policies SET control_mode = CASE WHEN level <= 1 THEN 'manual'
  WHEN level = 2 THEN 'assisted' ELSE 'autonomous' END WHERE control_mode IS NULL;
UPDATE autonomy_policies SET auto_permissions = '{"scheduling":false,"follow_ups":false,"task_creation":false,"reminders":false,"customer_replies":false,"inventory_reorders":false,"marketing_actions":false}'::jsonb WHERE auto_permissions IS NULL;
ALTER TABLE autonomy_policies ALTER COLUMN control_mode SET DEFAULT 'manual';
ALTER TABLE autonomy_policies ALTER COLUMN control_mode SET NOT NULL;
ALTER TABLE autonomy_policies ALTER COLUMN auto_permissions SET DEFAULT '{}'::jsonb;
ALTER TABLE autonomy_policies ALTER COLUMN auto_permissions SET NOT NULL;
