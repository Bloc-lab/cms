# Nase CMS – Multi-tenant Headless CMS

Multi-tenant Headless CMS v Node.js + TypeScript s Supabase jako databází a autentizací.

## Struktura (Monorepo)

```
cms/
├── apps/
│   ├── backend/     # Fastify API
│   └── admin/       # React admin (Vite + Tailwind)
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
