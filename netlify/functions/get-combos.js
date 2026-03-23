exports.handler = async function(event) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const url = process.env.SUPABASE_URL + '/rest/v1/combos?activo=eq.true&order=id';
    const resp = await fetch(url, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_ANON_KEY
      }
    });
    const data = await resp.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
