exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: '' };
  }
  const params = event.queryStringParameters || {};
  const { token, campaignId, dateFrom, dateTo } = params;
  if (!token || !campaignId) {
    return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'token and campaignId required' }) };
  }
  const url = `https://api.partner.market.yandex.ru/campaigns/${campaignId}/stats/orders`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Api-Key': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateFrom, dateTo })
    });
    const data = await response.text();
    return { statusCode: response.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: data };
  } catch (e) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
  }
};