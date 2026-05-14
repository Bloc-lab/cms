# Šablona na Vercelu: přidání další URL (další tenant)

Tento dokument popisuje, jak ke **stejné nasazené šabloně** připojit **další veřejnou adresu** tak, aby zobrazovala **data jiného tenanta** v CMS (jiný obsah, nastavení, API klíč).

Předpoklady:

- Jedna šablona (frontend) na **Vercelu**.
- CMS **backend** (např. na Renderu) s nastaveným `CORS_ORIGINS` dle potřeby.
- **Supabase** s tabulkami `tenants`, `tenant_domains`, obsahem vázaným na `tenant_id`.
- Veřejné čtení obsahu přes **`GET /api/v1/content`**, tenanta backend pozná podle **`X-API-KEY`** (plaintext klíč ↔ hash v `tenants.api_key_hash`).

---

## Přehled kroků

1. V databázi: druhý tenant, doména (`tenant_domains`), vlastní API klíč (hash).
2. Na Vercelu: přidat doménu, DNS u registrátora, env proměnné s klíčem.
3. V kódu šablony: výběr `X-API-KEY` podle `hostname` (a u SSR podle hostu z requestu).
4. Na backendu: do `CORS_ORIGINS` přidat origin nové URL.
5. Znovu **build / deploy** šablony (u Vite se `VITE_*` načítá při buildu).

---

## 1. Tenant a doména v Supabase

### 1.1 Druhý záznam tenanta

V tabulce **`tenants`** musí existovat samostatný řádek pro druhý web (jiné `id`, vlastní `admin_subdomain` atd.). Veškerý obsah (`content_entries`, `site_settings`, …) je vázaný na **`tenant_id`** — bez druhého tenanta nemáte co oddělit.

### 1.2 Navázání veřejné URL na tenanta

Do **`tenant_domains`** uložte řádek:

- **`tenant_id`** — ID tenanta pro tento web.
- **`domain`** — přesně tak, jak host vidí prohlížeč (malá písmena, bez `https://`, bez cesty).  
  - Příklad: `www.example.cz` **nebo** `example.cz` — podle toho, co reálně používáte.  
  - Pokud chcete obě varianty, často přidáte **dva** záznamy nebo jednu canonical a druhou přesměrujete ve Vercelu.
- **`type`**: `web` (pro veřejný web; backend při `Host` / `X-Tenant-Host` s druhem `web` hledá v této tabulce).

Legacy varianta je sloupec **`tenants.custom_domain`** (přesná shoda hostu); doporučený model je **`tenant_domains`**.

---

## 2. Druhý API klíč pro `/api/v1/content`

Endpoint **`GET /api/v1/content`** ignoruje doménu stránky; tenanta určuje **pouze** hlavička **`X-API-KEY`**. Stejný klíč na dvou URL tedy vždy vrátí **stejná data**.

### 2.1 Vygenerování klíče a hash

1. Vygenerujte náhodný bezpečný plaintext klíč (např. 32+ bajtů hex).
2. Z kořene tohoto repozitáře spočítejte hash (SHA-256 hex), stejně jako backend:

   ```bash
   npm run hash-api-key -- "VÁŠ_PLAINTEXT_KLÍČ"
   ```

3. V Supabase **SQL Editor**:

   ```sql
   UPDATE tenants
   SET api_key_hash = '<výstup z příkazu výše – 64 hex znaků>'
   WHERE id = '<uuid druhého tenanta>';
   -- nebo WHERE admin_subdomain = 'vas-slug';
   ```

4. Ověření:

   ```sql
   SELECT admin_subdomain, LENGTH(api_key_hash) AS hash_len
   FROM tenants;
   ```

   U řádku s klíčem musí být **`hash_len = 64`**.

Plaintext klíč **neukládejte** do databáze — jen do konfigurace šablony (Vercel env), viz níže.

---

## 3. Vercel: nová doména a DNS

1. **Vercel** → váš projekt šablony → **Settings** → **Domains** → **Add** — zadejte doménu (např. `www.example.cz`).
2. U **DNS** (registrátor, např. Wedos) nastavte záznamy **přesně podle instrukcí Vercelu** (typicky **CNAME** `www` → `cname.vercel-dns.com`).  
   - U `www` nesmí současně zůstat konfliktní **A** záznam na starý hosting.
3. Po ověření DNS Vercel vystaví **SSL**. Pokud selže HTTP-01 challenge, zkontrolujte DNS, případně **AAAA** záznamy a konflikty se starým hostingem.

Více URL na **jeden** projekt = stále **stejný** build; liší se jen HTTP hlavička **`Host`** (`Origin` pro CORS).

---

## 4. Backend: CORS

Prohlížeč posílá `Origin: https://www.vaše-domena.cz`. Na backendu (např. Render) musí být v **`CORS_ORIGINS`** výčet povolených originů, **oddělených čárkou**, s `https://`, **bez** koncového lomítka, např.:

```text
https://projekt.vercel.app,https://www.example.cz
```

Chybějící origin způsobí chybu typu *No 'Access-Control-Allow-Origin' header* u **preflight (OPTIONS)**.

Logika je v `apps/backend/src/index.ts` (proměnná `CORS_ORIGINS`, volitelně `CORS_ALLOW_VERCEL_PREVIEW` pro `*.vercel.app`).

---

## 5. Šablona: env na Vercelu a výběr klíče

### 5.1 Proměnné prostředí

Pro každou „linku“ / doménu použijte **vlastní** `VITE_*` proměnnou s plaintext klíčem, např.:

- `VITE_CMS_API_KEY_VERCEL` — klíč tenanta pro výchozí URL `*.vercel.app`
- `VITE_CMS_API_KEY_BLOCLAB` — klíč tenanta pro `www.bloclab.cz` (příklad)

Názvy si můžete pojmenovat jinak; důležité je **mapovat hostname → správná proměnná**.

### 5.2 Kód

Před každým `fetch` na `/api/v1/content` nastavte:

```http
X-API-KEY: <hodnota podle hostname>
```

- V **prohlížeči**: `window.location.hostname` (normalizovat např. na lowercase).
- Při **SSR** (Next, Nuxt, Astro…): host z incoming requestu (`Host` / `x-forwarded-host`), ne `window`.

### 5.3 Build

**Vite** vkládá `import.meta.env.VITE_*` do bundle ** při buildu**. Po změně env na Vercelu je nutný **nový deploy** (nebo Redeploy), jinak klient poběží se starými hodnotami.

---

## 6. Kontrolní checklist

| Krok | Kontrola |
|------|-----------|
| Druhý tenant v DB | Dva řádky v `tenants`, oddalěný obsah pod `tenant_id` |
| Doména → tenant | `tenant_domains.domain` = přesný host (`web`) |
| API klíč | `api_key_hash` = SHA-256 hex (64 znaků) z plaintextu v env |
| Vercel Domains + DNS | Zelené ověření, platný certifikát |
| `CORS_ORIGINS` | Obsahuje `https://` + přesnou novou doménu |
| Kód šablony | Jiný `X-API-KEY` podle hostname po redeploy |
| Ověření v DevTools | U druhé domény jiná hlavička `X-API-KEY`, odpověď 200 a očekávaný JSON |

---

## 7. Bezpečnost (stručně)

Plaintext klíč v prohlížeči není před uživateli skrytý — kdokoli ho může zkopírovat z DevTools. Pro čistě **veřejný** obsah je to běžné; pro citlivější scénáře zvažte **serverový proxy** na Vercelu (klíč jen v server env) nebo veřejné endpointy řízené doménou (`/api/v1/public/…`) s omezením v CORS a rate limitem na backendu.

---

## 8. Odkazy v tomto repu

- Hash klíče: `scripts/hash-api-key.mjs`, příkaz `npm run hash-api-key` (viz `README.md`).
- CORS a tenant v kódu: `apps/backend/src/index.ts`, `apps/backend/src/plugins/tenant.ts`, `apps/backend/src/lib/tenant.ts`.

---

*Tento dokument doplňuje hlavní [README](../README.md) u sekce API klíče a vývoje; je zaměřený na provoz více URL u jedné šablony na Vercelu.*
