// parse-xlsx: скачивает и парсит отчёт аналитики продаж Яндекс Маркета (XLSX)
const https = require('https');
const http = require('http');
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: '' };
  }
  const { url, token } = event.queryStringParameters || {};
  if (!url) return err('url required');
  try {
    const buf = await dlFile(decodeURIComponent(url));
    const rows = await parseXlsx(buf);
    return ok({ ok: true, rows, count: rows.length });
  } catch(e) {
    return err(e.message);
  }
};
const ok = b => ({ statusCode:200, headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}, body:JSON.stringify(b) });
const err = m => ({ statusCode:500, headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}, body:JSON.stringify({ok:false,error:m}) });

function dlFile(url) {
  return new Promise((resolve, reject) => {
    const prot = url.startsWith('https') ? https : http;
    prot.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return resolve(dlFile(res.headers.location));
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const ch = []; res.on('data', c => ch.push(c)); res.on('end', () => resolve(Buffer.concat(ch))); res.on('error', reject);
    }).on('error', reject).setTimeout(28000, function(){ this.destroy(); reject(new Error('timeout')); });
  });
}

async function parseXlsx(buf) {
  // Pure JS XLSX parse without npm dependencies
  // Use the xlsx package which is available in Node.js environments
  let XLSX;
  try { XLSX = require('xlsx'); } catch(e) { throw new Error('xlsx package not found: ' + e.message); }
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (data.length < 2) return [];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const day = String(r[0] || '').trim();
    if (!day) continue;
    const shows = parseFloat(r[6]) || 0;
    const clicks = parseFloat(r[9]) || 0;
    const cart = parseFloat(r[12]) || 0;
    const orders = parseFloat(r[15]) || 0;
    const revenue = parseFloat(r[17]) || 0;
    if (shows > 0 || clicks > 0) rows.push({ day, shows, clicks, cart, orders, revenue });
  }
  return rows;
}
