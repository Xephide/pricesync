// Проверяет статус асинхронного отчёта и возвращает URL файла
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: '' };
  }
  const { token, reportId } = event.queryStringParameters || {};
  if (!token || !reportId) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'token and reportId required' }) };
  try {
    const r = await fetch(`https://api.partner.market.yandex.ru/reports/info/${reportId}`, {
      headers: { 'Api-Key': token }
    });
    const d = await r.json();
    if (d.status !== 'OK') return { statusCode: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: d.errors?.[0]?.message || 'Info error' }) };
    const res = d.result || {};
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ status: res.status, fileUrl: res.file || null }) };
  } catch(e) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
  }
};
