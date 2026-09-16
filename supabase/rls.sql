-- Supabase RLS policies for Solvia
-- Run after migrations. Requires custom JWT claims: org_id, role

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE relances ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Helper: extract org_id from JWT
CREATE OR REPLACE FUNCTION auth_org_id() RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    auth.jwt()->>'org_id'
  );
$$ LANGUAGE SQL STABLE;

-- Organization-scoped tables
CREATE POLICY org_isolation_clients ON clients
  FOR ALL USING (organization_id = auth_org_id());

CREATE POLICY org_isolation_invoices ON invoices
  FOR ALL USING (organization_id = auth_org_id());

CREATE POLICY org_isolation_payments ON payments
  FOR ALL USING (organization_id = auth_org_id());

CREATE POLICY org_isolation_relances ON relances
  FOR ALL USING (organization_id = auth_org_id());

CREATE POLICY org_isolation_scoring ON scoring_configs
  FOR ALL USING (organization_id = auth_org_id());

CREATE POLICY org_isolation_ai ON ai_provider_configs
  FOR ALL USING (organization_id = auth_org_id());

CREATE POLICY org_isolation_alerts ON alert_events
  FOR ALL USING (organization_id = auth_org_id());

CREATE POLICY org_isolation_audit ON audit_logs
  FOR ALL USING (organization_id = auth_org_id());

CREATE POLICY org_isolation_notifications ON in_app_notifications
  FOR ALL USING (organization_id = auth_org_id());

CREATE POLICY org_isolation_users ON users
  FOR ALL USING (organization_id = auth_org_id());

CREATE POLICY org_isolation_orgs ON organizations
  FOR ALL USING (id = auth_org_id());

-- Payment allocations via invoice org check
CREATE POLICY org_isolation_allocations ON payment_allocations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = payment_allocations.invoice_id
      AND i.organization_id = auth_org_id()
    )
  );

CREATE POLICY user_notification_prefs ON notification_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = notification_preferences.user_id
      AND u.organization_id = auth_org_id()
    )
  );
