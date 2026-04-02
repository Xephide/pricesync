// Генерирует асинхронный отчёт аналитики продаж Яндекс Маркета
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: '' };
  }
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch(e) {}
  const { token, campaignId, dateFrom, dateTo, grouping } = body;
  if (!token) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'token required' }) };
  const payload = { dateFrom, dateTo, grouping: grouping || 'OFFERS' };
  if (campaignId) payload.campaignId = parseInt(campaignId);
  try {
    const r = await fetch('https://api.partner.market.yandex.ru/reports/shows-sales/generate', {
      method: 'POST',
      headers: { 'Api-Key': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const d = await r.json();
    if (d.status !== 'OK') return { statusCode: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: d.errors?.[0]?.message || 'Generate failed' }) };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ reportId: d.result.reportId }) };
  } catch(e) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
  }
};
