# Nase CMS – Multi-tenant Headless CMS

Multi-tenant Headless CMS v Node.js + TypeScript s Supabase jako databází a autentizací.

## Struktura (Monorepo)

```
cms/
├── apps/
│   ├── backend/     # Fastify API
│   ├── admin/       # React admin (Vite + Tailwind)
│   └── web-demo/    # Minimální ukázka veřejného webu (Vite proxy → API)
├── packages/
│   └── shared/      # Sdílené typy (bloky)
└── supabase/        # SQL migrace
```

## Požadavky

- Node.js 18+
- Supabase projekt

## Instalace

```bash
npm install
npm run build -w @nase-cms/shared   # před prvním spuštěním adminu
```

## Konfigurace

### Backend (`apps/backend/.env`)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_BASE_DOMAIN=mojecms.cz
CACHE_TTL_MS=300000
PORT=3000
```

### Admin (`apps/admin/.env`)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=                    # prázdné = proxy na backend (dev)
```

### Lokální vývoj se subdoménami

Pro testování multi-tenancy na localhost přidej do hosts souboru:

**Windows:** `C:\Windows\System32\drivers\etc\hosts`  
**Mac/Linux:** `/etc/hosts`

```
127.0.0.1 kadernictvi.localhost
127.0.0.1 instalater.localhost
```

Pak nastav `ADMIN_BASE_DOMAIN=localhost` a otevři např. `http://kadernictvi.localhost:5173`.

## Spuštění

```bash
# Backend (port 3000)
npm run dev

# Admin (port 5173, proxy na /api → backend)
npm run dev:admin
```

Vite proxy přeposílá `/api` na `http://localhost:3000`.

### Web demo (`apps/web-demo`)

Ukázkový statický klient volající `GET /api/v1/content` přes proxy (port **5174**, aby nekolidoval s adminem).

**API klíč musí sedět s databází:** v tabulce `tenants` je uložený jen **SHA-256 hash** (`api_key_hash`). Plaintext klíč dáš do `.env`, hash do Supabase:

```bash
# 1) Zvol tajný řetězec a spočítej hash (stejný algoritmus jako backend)
npm run hash-api-key -- "muj-tajny-klicek"

# 2) V Supabase → SQL: (nahraď hash výstupem z příkazu výše)
#    UPDATE tenants SET api_key_hash = '...' WHERE admin_subdomain = 'kadernictvi';

# 3) Do apps/web-demo/.env stejný plaintext:
#    VITE_CMS_API_KEY=muj-tajny-klicek
```

```bash
cp apps/web-demo/.env.example apps/web-demo/.env
# doplň VITE_CMS_API_KEY podle kroku výše

npm run dev          # backend :3000
npm run dev:web-demo # demo :5174
```

Otevři http://localhost:5174 - zobrazí JSON obsahu nebo chybu z API.

**Stále 401?** Ověř v Supabase (stejný projekt jako `SUPABASE_*` v `apps/backend/.env`):

```sql
SELECT admin_subdomain, LENGTH(api_key_hash) AS hash_len
FROM tenants;
```

- `hash_len` musí být **64** (SHA-256 hex). Pokud je `NULL`, `UPDATE` nezasáhl řádek (špatný `WHERE`) nebo měníš jiný Supabase projekt než backend.
- Ověření mimo prohlížeč (stejný klíč jako v `.env`):

```bash
curl -s -H "X-API-KEY: TVUJ_PLAINTEXT" "http://localhost:3000/api/v1/content?lang=cs"
```

Měl bys dostat JSON (HTTP 200). Při `401` je problém v DB / hash / plaintext klíči (ne ve Vite).

Po změně kódu backendu **restartuj** `npm run dev` (backend).

## Admin rozhraní

- **Login** – Supabase Auth (email + heslo)
- **Dashboard** – seznam stránek, vytvoření, mazání
- **Editor stránek** – Block Editor (Hero, Text Section, Gallery)
- **Knihovna médií** – upload a výběr obrázků

Bloky se ukládají jako JSON pole. Každý jazyk (CZ/EN) má vlastní sadu bloků.

## API

- **Admin** (`/api/v1/admin/*`): JWT v hlavičce `Authorization: Bearer <token>`, tenant z Host subdomény
- **Content** (`/api/v1/content/*`): tenant z hlavičky `X-API-KEY`

## Migrace

Spusť v Supabase SQL Editoru v pořadí:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_media_bucket_and_metadata.sql`

## Testování

Kompletní návod včetně seed dat: **[docs/TESTING.md](docs/TESTING.md)**

## Šablona: více URL na Vercelu (více tenantů)

Nasazení stejné šablony na další doménu, DNS, CORS, API klíče a mapování na tenanta: **[docs/TEMPLATE_MULTI_URL.md](docs/TEMPLATE_MULTI_URL.md)**
