exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: '' };
  const params = event.queryStringParameters || {};
  const { id, key, sheet } = params;
  if (!id || !key) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'id and key required' }) };
  const sheetName = sheet || 'Связки iFlow (СПБ)';
  const range = encodeURIComponent(sheetName + '!A:B');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}?key=${key}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) return { statusCode: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: false, error: data.error.message }) };
    const rows = (data.values || []).slice(1);
    const bindings = rows.filter(r => r[0] && r[1]).map(r => ({ article: r[0].trim(), name: r[1].trim() }));
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true, bindings, total: bindings.length }) };
  } catch (e) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};