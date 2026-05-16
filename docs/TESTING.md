# Návod na testování Nase CMS

## 1. Příprava Supabase

### 1.1 Migrace
1. Otevři [Supabase Dashboard](https://supabase.com/dashboard) → tvůj projekt
2. **SQL Editor** → New query
3. Zkopíruj a spusť `supabase/migrations/001_initial_schema.sql`
4. Zkopíruj a spusť `supabase/migrations/002_media_bucket_and_metadata.sql`
5. Spusť další migrace v číselném pořadí (`003`–`011`) podle potřeby. Pro **autosave konceptů a náhled** jsou nutné `010_content_and_site_settings_drafts.sql` a `011_content_preview_tokens.sql` (veřejný náhled přes `?previewToken=`).

### 1.2 Vytvoření uživatele
1. **Authentication** → **Users** → **Add user** → **Create new user**
2. Zadej email (např. `test@example.com`) a heslo
3. Po vytvoření zkopíruj **User UID** (UUID)

### 1.3 Testovací tenant a propojení
1. **SQL Editor** → New query
2. Spusť:

```sql
-- Vytvoř tenanta
INSERT INTO tenants (name, admin_subdomain)
VALUES ('Test Kadernictví', 'kadernictvi')
ON CONFLICT (admin_subdomain) DO NOTHING;

-- Získej tenant_id (nebo použij známé UUID)
-- Propoj uživatele - NAHRAĎ 'TVOJ-USER-UID' za UUID z kroku 1.2
INSERT INTO tenant_users (tenant_id, user_id, role)
SELECT t.id, 'TVOJ-USER-UID'::uuid, 'EDITOR'
FROM tenants t WHERE t.admin_subdomain = 'kadernictvi'
ON CONFLICT DO NOTHING;

-- (Volitelné) Nastav jako SUPER_ADMIN
UPDATE profiles SET role = 'SUPER_ADMIN' WHERE id = 'TVOJ-USER-UID'::uuid;
```

---

## 2. Lokální prostředí

### 2.1 Hosts soubor
**Windows:** Otevři jako správce `C:\Windows\System32\drivers\etc\hosts`

Přidej řádek:
```
127.0.0.1 kadernictvi.localhost
```

### 2.2 Env proměnné
`apps/backend/.env`:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_BASE_DOMAIN=localhost
PORT=3000
```

`apps/admin/.env`:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=
# Náhled webu podle tenant šablony (`site_settings.template_id`):

# Fallback pro všechny šablony (nebo kde není vlastní řádek v mapě ani _TEMPLATE1 / _ARCH)
# VITE_PUBLIC_SITE_URL=https://tvuj-web.cz

# Volitelně zvlášť pro MONO (template1) / ARCH arch
# VITE_PUBLIC_SITE_URL_TEMPLATE1=https://mono.example.vercel.app
# VITE_PUBLIC_SITE_URL_ARCH=https://arch.example.vercel.app

# Nejpružnější: JSON map template_id → URL (nezávislé na počtu šablon)
# VITE_PUBLIC_SITE_URL_MAP={"template1":"https://mono.vercel.app","arch":"https://arch.vercel.app"}
```

---

## 3. Spuštění

### Terminál 1 – Backend
```bash
cd i:\nase-cms
npm run dev
```
Očekávaný výstup: `Server running at http://localhost:3000`

### Terminál 2 – Admin
```bash
cd i:\nase-cms
npm run dev:admin
```
Očekávaný výstup: `Local: http://localhost:5173/`

---

## 4. Testovací scénáře

### A) Přihlášení
1. Otevři **http://kadernictvi.localhost:5173**
2. Přihlas se emailem a heslem z kroku 1.2
3. Měl bys vidět Dashboard se seznamem stránek

### B) Vytvoření stránky
1. Klikni **+ Nová stránka**
2. Zadej slug např. `domovska-stranka`
3. Po vytvoření se otevře editor

### C) Block Editor
1. V editoru klikni **+ Přidat blok**
2. Přidej **Hero** – vyplň titulek, podtitulek, URL obrázku
3. Přidej **Text** – napiš obsah v Markdownu
4. Klikni **Uložit**

### G) Koncept (autosave) a náhled
1. Uprav text na stránce v **Obsah webu** - po chvíli se v patičce objeví „Koncept uložen“.
2. **Odkaz náhledu na web** v administraci zkopíruje URL s `?previewToken=…` pro zobrazení náhledu na frontendu (viz `docs/FRONTEND_PREVIEW_PROMPT.md`).
3. **Publikovat změny** zapíše do živých tabulek; **Zrušit rozpracované** smaže koncept v DB a vrátí formulář k poslední publikované verzi.
1. V menu klikni **Média**
2. **+ Nahrát obrázek** – vyber JPEG/PNG
3. Obrázek se zobrazí v gridu

### E) Galerie v bloku
1. V editoru přidej blok **Galerie**
2. Klikni **Vybrat z knihovny**
3. Vyber nahrané obrázky
4. Ulož stránku

### F) Content API (veřejné)
1. V Supabase vygeneruj API klíč pro tenanta (nebo použij existující)
2. Hash ulož do `tenants.api_key_hash`
3. Test v terminálu:

```bash
curl -H "X-API-KEY: tvuj-api-klic" "http://localhost:3000/api/v1/content/pages/domovska-stranka?lang=cs"
```

---

## 5. Řešení problémů

| Problém | Řešení |
|---------|--------|
| "Tenant not found" | Ověř, že `kadernictvi.localhost` je v hosts a `ADMIN_BASE_DOMAIN=localhost` |
| "Invalid token" | Zkontroluj, že jsi přihlášen a JWT je platný |
| "Access denied to tenant" | Spusť SQL pro propojení `tenant_users` |
| Obrázky se nezobrazují | Ověř, že bucket `media` je public v Supabase Storage |
| Proxy nefunguje | Admin musí běžet na `kadernictvi.localhost:5173`, ne `localhost:5173` |
