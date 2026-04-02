// update-prices v3: автоматически пробует business-эндпоинт, при 423 — campaign-эндпоинт
exports.handler = async function(event) {
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch(e) {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { token, bizId, campaignId, offers } = body;
  if (!token || !offers || !offers.length) {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'token and offers required' }) };
  }

  const bid = bizId || '216511608';
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Функция одного запроса
  async function tryUpdate(url) {
    let r, rawText;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        r = await fetch(url, {
          method: 'POST',
          headers: { 'Api-Key': token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ offers })
        });
        rawText = await r.text();
        // 420/429 rate limit → retry
        if (r.status === 420 || r.status === 429) {
          await sleep(2500 * (attempt + 1));
          continue;
        }
        return { status: r.status, text: rawText };
      } catch(e) {
        if (attempt < 2) { await sleep(1500); continue; }
        return { status: 0, text: e.message };
      }
    }
    return { status: 0, text: 'Rate limit after retries' };
  }

  // 1. Пробуем business-уровень
  const bizUrl = `https://api.partner.market.yandex.ru/businesses/${bid}/offer-prices/updates`;
  let res = await tryUpdate(bizUrl);

  // 2. Если 423 (кабинет использует единые цены ИЛИ модель не поддерживает) — пробуем campaign-уровень
  if (res.status === 423 && campaignId) {
    const camUrl = `https://api.partner.market.yandex.ru/campaigns/${campaignId}/offer-prices/updates`;
    res = await tryUpdate(camUrl);
  }

  // Парсим ответ
  let parsed;
  try { parsed = JSON.parse(res.text); } catch(e) { parsed = { raw: res.text }; }

  if (res.status === 200 && (parsed.status === 'OK' || !parsed.status || parsed.status === undefined)) {
    return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'OK' }) };
  }

  const errMsg = parsed?.errors?.[0]?.message || parsed?.error || `HTTP ${res.status}: ${res.text.slice(0, 300)}`;
  return { statusCode: res.status || 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ERROR', error: errMsg, httpStatus: res.status }) };
};
