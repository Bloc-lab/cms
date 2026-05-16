const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app missing');

const apiKey = import.meta.env.VITE_CMS_API_KEY?.trim();

if (!apiKey) {
  app.innerHTML = `
    <p style="font-family: system-ui; padding: 1rem; color: #b91c1c;">
      Chybí <code>VITE_CMS_API_KEY</code> v <code>apps/web-demo/.env</code>.
    </p>
  `;
} else {
  app.innerHTML = '<p style="font-family: system-ui; padding: 1rem;">Načítám obsah z CMS…</p>';

  const pageParams = new URLSearchParams(window.location.search);
  const lang = pageParams.get('lang')?.trim() || 'cs';
  const previewToken = pageParams.get('previewToken')?.trim();

  const qs = new URLSearchParams({ lang });
  if (previewToken) {
    qs.set('previewToken', previewToken);
  }

  fetch(`/api/v1/content?${qs.toString()}`, {
    headers: { 'X-API-KEY': apiKey },
  })
    .then(async (res) => {
      const text = await res.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      if (!res.ok) {
        const hint401 =
          res.status === 401
            ? `<p style="font-family: system-ui; padding: 0 1rem 1rem; color: #444; font-size: 0.875rem;">401 - plaintext v <code>.env</code> musí odpovídat <code>tenants.api_key_hash</code> (hash: <code>npm run hash-api-key</code> v kořeni repa).</p>`
            : '';
        app.innerHTML = `
          ${hint401}
          <pre style="font-family: ui-monospace; padding: 1rem; background: #fef2f2; color: #991b1b;">HTTP ${res.status}\n${typeof body === 'string' ? body : JSON.stringify(body, null, 2)}</pre>
        `;
        return;
      }
      app.innerHTML = `
        <p style="font-family: system-ui; padding: 1rem; color: #166534;">OK - obsah z <code>/api/v1/content</code></p>
        <pre style="font-family: ui-monospace; padding: 1rem; background: #f8fafc; overflow: auto; max-height: 80vh;">${JSON.stringify(body, null, 2)}</pre>
      `;
    })
    .catch((err) => {
      app.innerHTML = `
        <pre style="font-family: ui-monospace; padding: 1rem; background: #fef2f2;">${String(err)}</pre>
        <p style="font-family: system-ui; padding: 0 1rem;">Běží backend na <code>http://localhost:3000</code>?</p>
      `;
    });
}
