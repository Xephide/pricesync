exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Api-Key, Authorization, x-ya-token' }, body: '' };
  }
  const params = event.queryStringParameters || {};
  const token = params.token;
  const bizId = params.bizId || '216511608';
  const pageToken = params.page_token;
  if (!token) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'token required' }) };
  let url = `https://api.partner.market.yandex.ru/businesses/${bizId}/offer-mappings?limit=200`;
  if (pageToken) url += `&page_token=${encodeURIComponent(pageToken)}`;
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Api-Key': token, 'Content-Type': 'application/json' }, body: '{}' });
    const data = await response.text();
    return { statusCode: response.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: data };
  } catch (e) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
  }
};