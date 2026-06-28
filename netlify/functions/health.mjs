export default async (request) => {
  const expected = process.env.OREN_APP_PASSWORD;
  const received = request.headers.get('authorization') || '';
  if (!expected || received !== `Bearer ${expected}`) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Code invalide.' }) };
  }
  const configured = Boolean(process.env.OREN_APPS_SCRIPT_URL && process.env.OREN_SYNC_TOKEN);
  return { statusCode: configured ? 200 : 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify({ ok: configured, service: 'oren-fm-pilotage', configured }) };
};
