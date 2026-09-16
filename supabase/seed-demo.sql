-- Seed demo Solvia — à exécuter dans Supabase SQL Editor (APRÈS migration.sql)
-- Crée l'organisation demo. Liez ensuite votre user Auth (voir docs/12-production-first-setup.md)

INSERT INTO organizations (id, name, timezone, currency, risk_threshold, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo PME',
  'Europe/Paris',
  'EUR',
  70,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO scoring_configs (id, organization_id, criteria, risk_threshold, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '[
    {"name":"Montant en retard","metricType":"montant_en_retard","weight":0.5,"enabled":true},
    {"name":"Ancienneté du retard","metricType":"anciennete_retard","weight":0.3,"enabled":true},
    {"name":"Historique de retards","metricType":"taux_retard_historique","weight":0.2,"enabled":true}
  ]'::jsonb,
  70,
  NOW(),
  NOW()
)
ON CONFLICT (organization_id) DO NOTHING;

-- Remplacez UUID-AUTH et email après création user dans Supabase Auth :
-- INSERT INTO users (id, organization_id, auth_user_id, role, email, can_receive_alerts, can_relance_clients, created_at, updated_at)
-- VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'UUID-AUTH', 'admin', 'votre@email.com', true, true, NOW(), NOW());
