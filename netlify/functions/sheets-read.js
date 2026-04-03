exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: '' };
  const params = event.queryStringParameters || {};
  const { id, key, sheet } = params;
  if (!id || !key) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'id and key required' }) };
  const sheetName = sheet || 'Связки iFlow (СПБ)';
  const bindingsRange = encodeURIComponent(sheetName + '!A:C');
  const constantsRange = encodeURIComponent('Константы!A:B');
  const urlBindings = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${bindingsRange}?key=${key}`;
  const urlConstants = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${constantsRange}?key=${key}`;
  try {
    const [respBindings, respConstants] = await Promise.all([fetch(urlBindings), fetch(urlConstants)]);
    const dataBindings = await respBindings.json();
    const dataConstants = await respConstants.json();
    if (dataBindings.error) return { statusCode: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: false, error: dataBindings.error.message }) };
    if (dataConstants.error) return { statusCode: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: false, error: dataConstants.error.message }) };

    const rows = (dataBindings.values || []).slice(1);
    const bindings = rows.filter(r => r[0] && r[1]).map(r => ({
      article: String(r[0] || '').trim(),
      name: String(r[1] || '').trim(),
      category: String(r[2] || '').trim()
    }));

    const commRows = (dataConstants.values || []).slice(1);
    const commissions = {};
    for (const r of commRows) {
      const cat = String(r[0] || '').trim().toLowerCase();
      const valRaw = String(r[1] || '').trim().replace(',', '.');
      const val = parseFloat(valRaw);
      if (cat && !Number.isNaN(val)) commissions[cat] = val;
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true, bindings, commissions, total: bindings.length }) };
  } catch (e) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
