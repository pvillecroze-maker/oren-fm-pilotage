const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  }
});

function readPassword() {
  return String(process.env.OREN_APP_PASSWORD || '').trim();
}

export default async (request) => {
  if (request.method !== 'GET') return json(405, { ok: false, error: 'Méthode non autorisée.' });

  const expected = readPassword();
  if (!expected) {
    return json(503, { ok: false, error: 'Variable Netlify OREN_APP_PASSWORD absente pour les fonctions.' });
  }

  const received = request.headers.get('authorization') || '';
  if (received !== `Bearer ${expected}`) {
    return json(401, { ok: false, error: 'Le code saisi ne correspond pas à OREN_APP_PASSWORD dans Netlify.' });
  }

  const endpoint = String(process.env.OREN_APPS_SCRIPT_URL || '').trim();
  const token = String(process.env.OREN_SYNC_TOKEN || '').trim();
  if (!endpoint || !token) return json(503, { ok: false, error: 'Variables Netlify Apps Script incomplètes.' });

  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return json(503, { ok: false, error: 'URL Apps Script invalide dans Netlify.' });
  }
  url.searchParams.set('mode', 'briefing');
  url.searchParams.set('token', token);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    const raw = await response.text();
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return json(502, { ok: false, error: 'Apps Script a renvoyé une réponse non JSON.' });
    }
    if (!response.ok || !payload.ok) return json(502, { ok: false, error: payload.error || 'Apps Script a refusé la synchronisation.' });
    return json(200, payload);
  } catch (error) {
    return json(504, { ok: false, error: `Passerelle indisponible : ${error.message}` });
  }
};
