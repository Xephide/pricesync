exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-ya-token'
      },
      body: ''
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch(e) {
    return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { token, bizId, offers } = body;

  if (!token || !offers || !offers.length) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'token and offers required' })
    };
  }

  const bid = bizId || '216511608';
  const url = `https://api.partner.market.yandex.ru/businesses/${bid}/offer-prices/updates`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ offers })
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
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
