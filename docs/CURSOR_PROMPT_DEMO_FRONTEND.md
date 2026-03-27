# Prompt pro nový projekt: demo frontend pro Nase CMS

Zkopíruj **celý blok níže** (od „Jsi vývojář…“ až po konec) do nového chatu Cursoru v **samostatném repozitáři** (např. Vite + React nebo Astro). Backend CMS běží odděleně; tento projekt je jen veřejný web, který čte obsah přes API.

---

## Prompt (vlož do Cursoru)

Jsi vývojář frontendu. Stavím **statický / demo web**, který má ukázat, jak funguje napojení na **Nase CMS** — multi-tenant headless CMS (Fastify + Supabase). Administrace je jiná aplikace; tento projekt je **pouze veřejný web** čtoucí obsah.

### Autentizace a tenant

- **Veřejný obsah** se bere endpointem **`GET /api/v1/content`**
- **Povinná hlavička:** `X-API-KEY: <API klíč tenanta>`  
  Tenanta CMS pozná podle API klíče (hash v DB). Bez platného klíče API vrátí chybu.
- **Volitelný query parametr:** `lang` — `cs` nebo `en` (výchozí v API je `cs`).  
  Příklad: `GET https://<tvůj-backend>/api/v1/content?lang=cs`

### Odpověď API

- **JSON objekt:** `Record<string, string>` — plochá mapa **klíč → textová hodnota** (včetně URL obrázků jako řetězců).
- Hodnoty v administraci jsou ukládány s prefixem stránky (`pageId:fieldKey`), ale **veřejné API** klíče **normalizuje**:
  - **Domovská stránka (pageId `main`):** klíče jako `hero.title`, `hero.subtitle`, `hero.image`, `services.title`, `services.desc`, `contact.phone`, `contact.email`, `contact.address`
  - **Stránka „O nás“ (slug `o-nas`, pageId `about`):** např. `about.text`
- Metadata pro branding v odpovědi mohou být jako `admin.siteName`, `admin.logo` (záleží na datech v DB).

### Volitelné: branding bez API klíče (přihlášení / náhled)

- **`GET /api/v1/public/site-info`** — tenant se bere z **Host** (subdoména), **bez** `X-API-KEY`
- Odpověď: `{ siteName: string, logoUrl: string | null }`  
  Použití: např. přihlašovací stránka adminu, nebo demo záhlaví, pokud nechceš tahat celý content.

### Směrování stránek demo webu

V repozitáři CMS je konfigurace stránek (reference pro tvůj routing):

| Logická stránka | Page ID | Slug (cesta) | Typické klíče v JSON z `/api/v1/content` |
|-----------------|---------|--------------|-------------------------------------------|
| Domů | `main` | `/` | `hero.*`, `services.*`, `contact.*` |
| O nás | `about` | `/o-nas` | `about.text` |

Routing ve frontendu: např. `/` = home, `/o-nas` = about stránka. Obsah pro každou stránku vyfiltruj podle klíčů výše (nebo všechny klíče na home a jen `about.text` na stránce O nás).

### Technické požadavky

1. **Env proměnné:** např. `VITE_PUBLIC_CMS_API_URL` nebo `PUBLIC_CMS_API_URL` = base URL backendu (bez koncového `/`), a `VITE_CMS_API_KEY` nebo `PUBLIC_CMS_API_KEY` = klíč tenanta (pro build demo **nepublikuj** v produkci do veřejného repo; použij lokální `.env`).
2. **Fetch:** `fetch(\`${API_URL}/api/v1/content?lang=${lang}\`, { headers: { 'X-API-KEY': apiKey } })`
3. **Chyby:** 401/403/500 zobrazit srozumitelně v demo UI.
4. **UI:** čistý, moderní demo (hero, sekce služeb, kontakt, stránka O nás), responzivní, **české texty** z API nebo fallback.
5. **Stack:** libovolný (doporučení: Vite + React nebo Astro). SSR/SSG volitelné; stačí client-side fetch pro demo.

### Co nerealizovat v tomto projektu

- Přihlášení do CMS, upload médií, editace — to je **admin aplikace** CMS.
- Volání `/api/v1/admin/*` — vyžaduje JWT a subdoménu adminu.

### Cíl

Vytvoř **jeden malý demo web** (několik stránek), který ukáže, že rozumí struktuře klíčů z CMS a správně volá API s `X-API-KEY` a `lang`. Pokud v odpovědi chybí některé klíče, zobraz rozumný placeholder.

---

## Po vložení promptu

Do `.env` v novém projektu doplň **`VITE_CMS_API_KEY`** (plaintext klíč tenanta; hash je v `tenants.api_key_hash`).

### Lokální vývoj: Vite proxy (doporučeno)

Aby `fetch` šel na **stejný origin** jako dev server (žádné CORS), přidej do `vite.config.ts`:

```ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: false,
        secure: false,
      },
    },
  },
});
```

(`changeOrigin: true` by přepsalo `Host` na backend a u CMS adminu by zmizela subdoména tenanta → 404.)

V kódu volej **relativní URL** a prázdné `VITE_API_URL`:

```ts
fetch('/api/v1/content?lang=cs', {
  headers: { 'X-API-KEY': import.meta.env.VITE_CMS_API_KEY },
});
```

Backend musí běžet na `:3000`. V tomto repu je stejný vzor v `apps/admin/vite.config.ts` a hotová ukázka v **`apps/web-demo`** (`npm run dev:web-demo`, port 5174).

### Jinak: přímá URL + CORS

Pokud voláš `http://localhost:3000` z jiného portu bez proxy, na Fastify musí být **CORS** pro origin frontendu.

---

Soubor v tomto repu: `docs/CURSOR_PROMPT_DEMO_FRONTEND.md` — slouží jako dokumentace pro přenos promptu do jiného okna Cursoru.
