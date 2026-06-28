const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify(body)
});

function isAuthorized(request) {
  const expected = process.env.OREN_APP_PASSWORD;
  const received = request.headers.get('authorization') || '';
  return Boolean(expected && received === `Bearer ${expected}`);
}

export default async (request) => {
  if (request.method !== 'GET') return json(405, { ok: false, error: 'Méthode non autorisée.' });
  if (!isAuthorized(request)) return json(401, { ok: false, error: 'Code d’accès Oren FM invalide.' });

  const endpoint = process.env.OREN_APPS_SCRIPT_URL;
  const token = process.env.OREN_SYNC_TOKEN;
  if (!endpoint || !token) {
    return json(503, { ok: false, error: 'Configuration Netlify incomplète.' });
  }

  const url = new URL(endpoint);
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
      return json(502, { ok: false, error: 'Apps Script a renvoyé une réponse non lisible.' });
    }
    if (!response.ok || !payload.ok) {
      return json(502, { ok: false, error: payload.error || 'Apps Script a refusé la synchronisation.' });
    }
    return json(200, payload);
  } catch (error) {
    return json(504, { ok: false, error: `Passerelle indisponible : ${error.message}` });
  }
};
