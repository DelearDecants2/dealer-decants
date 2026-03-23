const { verifyAdmin } = require('./verify-admin-token');

exports.handler = async function(event) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  if (!verifyAdmin(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'No autorizado' }) };
  }

  try {
    const { id, estado } = JSON.parse(event.body);
    const url = process.env.SUPABASE_URL + '/rest/v1/pedidos?id=eq.' + id;
    const resp = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ estado })
    });
    if (!resp.ok) throw new Error('Update failed: ' + resp.status);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};