
// Netlify Function: только чтение Google Sheets
// БД ведётся вручную в таблице
const https = require('https');

exports.handler = async (event) => {
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: h, body: '' };

  const { id, key, sheet } = event.queryStringParameters || {};
  if (!id || !key) return { statusCode: 400, headers: h, body: JSON.stringify({ error: 'id и key обязательны' }) };

  const sheetName = sheet || 'Связки iFlow';
  const range = encodeURIComponent(sheetName + '!A:B');
  const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}?key=${key}`;

  try {
    const raw = await httpsGet(apiUrl);
    const parsed = JSON.parse(raw);
    if (parsed.error) throw new Error(parsed.error.message);
    const rows = (parsed.values || []).slice(1);
    const bindings = rows
      .filter(r => r[0] && r[1])
      .map(r => ({ article: r[0].trim(), name: r[1].trim() }));
    return { statusCode: 200, headers: h, body: JSON.stringify({ ok: true, bindings, total: bindings.length }) };
  } catch (err) {
    return { statusCode: 500, headers: h, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return httpsGet(res.headers.location).then(resolve).catch(reject);
      const c = [];
      res.on('data', d => c.push(d));
      res.on('end', () => resolve(Buffer.concat(c).toString('utf8')));
    }).on('error', reject);
  });
}
