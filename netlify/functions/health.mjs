const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

export default async (request) => {
  const expected = process.env.OREN_APP_PASSWORD;
  const received = request.headers.get('authorization') || '';
  if (!expected || received !== `Bearer ${expected}`) return json(401, { ok: false, error: 'Code invalide.' });
  const configured = Boolean(process.env.OREN_APPS_SCRIPT_URL && process.env.OREN_SYNC_TOKEN);
  return json(configured ? 200 : 503, { ok: configured, service: 'oren-fm-pilotage', configured });
};
