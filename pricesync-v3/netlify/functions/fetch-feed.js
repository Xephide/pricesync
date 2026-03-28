
// Netlify Function: CORS-прокси к 1-опт фиду
// Запрос идёт с сервера Netlify -> Authorization header работает, нет CORS блокировки
const https = require('https');
const http = require('http');

exports.handler = async (event) => {
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: h, body: '' };

  const { url, token } = event.queryStringParameters || {};
  if (!url || !token) return { statusCode: 400, headers: h, body: JSON.stringify({ error: 'url и token обязательны' }) };

  try {
    const feedUrl = decodeURIComponent(url);
    const result = await fetchWithRedirect(feedUrl, token, 0);
    return { statusCode: 200, headers: { ...h, 'Content-Type': result.ct || 'text/plain' }, body: result.body };
  } catch (err) {
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: err.message }) };
  }
};

function fetchWithRedirect(url, token, depth) {
  if (depth > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': 'PriceSync/1.0' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchWithRedirect(res.headers.location, token, depth + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ body: Buffer.concat(chunks).toString('utf8'), ct: res.headers['content-type'] }));
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout 20s')); });
  });
}
