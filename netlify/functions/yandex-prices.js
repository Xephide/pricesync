// Netlify Function: yandex-prices.js
// Проксирует запросы к Яндекс Маркет API (business offer-mappings)
// Правильный заголовок: Api-Key (не Bearer/OAuth)

exports.handler = async function(event) {
  const token = event.queryStringParameters?.token || event.headers?.['x-ya-token'];
  const bizId = event.queryStringParameters?.bizId || '216511608';
  const pageToken = event.queryStringParameters?.page_token;

  if (!token) {
    return { statusCode: 400, body: JSON.stringify({ error: 'token required' }) };
  }

  let url = `https://api.partner.market.yandex.ru/businesses/${bizId}/offer-mappings?limit=200`;
  if (pageToken) url += `&page_token=${pageToken}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': token,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });

    const data = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: data
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
