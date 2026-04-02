// update-prices: обновляет цены через POST /businesses/{bizId}/offer-prices/updates
// FIX: строго одиночные запросы, retry при 420, детальные ошибки
exports.handler = async function(event) {
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch(e) {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { token, bizId, offers } = body;
  if (!token || !offers || !offers.length) {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'token and offers required' }) };
  }

  const bid = bizId || '216511608';
  // Максимум 500 за раз по документации, но батч уже нарезан на клиенте (20 шт)
  const url = `https://api.partner.market.yandex.ru/businesses/${bid}/offer-prices/updates`;

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Retry до 3 раз при 420 (parallel limit) или 429
  for (let attempt = 0; attempt < 3; attempt++) {
    let r, rawText;
    try {
      r = await fetch(url, {
        method: 'POST',
        headers: { 'Api-Key': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ offers })
      });
      rawText = await r.text();
    } catch(e) {
      if (attempt < 2) { await sleep(1500 * (attempt + 1)); continue; }
      return { statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
    }

    // 420 = параллельный лимит → ждём и повторяем
    if (r.status === 420) {
      await sleep(2000 * (attempt + 1));
      continue;
    }

    // Пробуем распарсить ответ
    let parsed;
    try { parsed = JSON.parse(rawText); } catch(e) { parsed = { raw: rawText }; }

    if (r.status === 200 && (parsed.status === 'OK' || !parsed.status)) {
      return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'OK' }) };
    }

    // Возвращаем ошибку с деталями
    const errMsg = parsed?.errors?.[0]?.message || parsed?.error || `HTTP ${r.status}: ${rawText.slice(0, 200)}`;
    return { statusCode: r.status, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ERROR', error: errMsg }) };
  }

  return { statusCode: 420, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ERROR', error: 'Rate limit: превышен лимит параллельных запросов' }) };
};
