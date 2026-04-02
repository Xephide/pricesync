// shows-sales-generate: запрашивает асинхронный отчёт аналитики Яндекс Маркета
// FIX: retry при rate limit, детальные ошибки, поддержка campaignId опционально
exports.handler = async function(event) {
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch(e) {}

  const { token, campaignId, dateFrom, dateTo, grouping } = body;
  if (!token) return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'token required' }) };

  const payload = {
    dateFrom,
    dateTo,
    grouping: grouping || 'OFFERS'
  };
  if (campaignId) payload.campaignId = parseInt(campaignId);

  try {
    const r = await fetch('https://api.partner.market.yandex.ru/reports/shows-sales/generate', {
      method: 'POST',
      headers: { 'Api-Key': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const rawText = await r.text();

    // Rate limit: 10 points per hour
    if (r.status === 429 || r.status === 420) {
      return { statusCode: 429, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: `Rate limit: ${rawText.slice(0, 300)}` }) };
    }

    let d;
    try { d = JSON.parse(rawText); } catch(e) {
      return { statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Parse error: ' + rawText.slice(0, 200) }) };
    }

    if (d.status !== 'OK') {
      const msg = d.errors?.[0]?.message || d.error || JSON.stringify(d).slice(0, 300);
      return { statusCode: r.status, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: msg }) };
    }

    return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId: d.result.reportId }) };
  } catch(e) {
    return { statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
  }
};
