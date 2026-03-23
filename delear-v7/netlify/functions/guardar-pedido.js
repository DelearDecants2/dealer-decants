exports.handler = async function(event) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{"error":"Method Not Allowed"}' };

  try {
    const pedido = JSON.parse(event.body);
    const id = 'TRF-' + Date.now() + '-' + Math.random().toString(36).substr(2,5);
    const datos = {
      id,
      fecha: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
      estado: 'pendiente',
      tipo: 'transferencia',
      cliente: pedido.cliente,
      items: pedido.items,
      totales: pedido.totales
    };

    const url = process.env.SUPABASE_URL + '/rest/v1/pedidos';
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(datos)
    });
    if (!resp.ok) throw new Error('Insert failed: ' + resp.status);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id }) };
  } catch(err) {
    console.error('guardar-pedido error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};