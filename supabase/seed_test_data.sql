-- Testovací data pro lokální vývoj
-- Spusť PO migracích 001 a 002
-- POZOR: Nejdřív vytvoř uživatele v Supabase Auth (Authentication → Users → Add user)
-- Pak získej jeho UUID z Authentication → Users a nahraď USER_ID níže

-- 1. Vytvoř testovací tenanta (api_key_hash pro GET /api/v1/content — viz README „hash-api-key“)
INSERT INTO tenants (name, admin_subdomain)
VALUES ('Test Kadernictví', 'kadernictvi')
ON CONFLICT (admin_subdomain) DO NOTHING;

-- Po npm run hash-api-key -- "tvuj-klicek" nastav hash např.:
-- UPDATE tenants SET api_key_hash = '<sha256 hex z příkazu>' WHERE admin_subdomain = 'kadernictvi';

-- 2. Propoj uživatele s tenantem
-- Nahraď 'TVOJ-USER-UUID' UUID z Supabase Auth (Authentication → Users)
-- INSERT INTO tenant_users (tenant_id, user_id, role)
-- SELECT t.id, 'TVOJ-USER-UUID'::uuid, 'EDITOR'
-- FROM tenants t WHERE t.admin_subdomain = 'kadernictvi';

-- 3. (Volitelné) Nastav prvního uživatele jako SUPER_ADMIN
-- UPDATE profiles SET role = 'SUPER_ADMIN' WHERE id = 'TVOJ-USER-UUID'::uuid;
