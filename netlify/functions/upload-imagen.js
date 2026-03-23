const { verifyAdmin } = require('./verify-admin-token');

exports.handler = async function(event) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  if (!verifyAdmin(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'No autorizado' }) };
  }

  try {
    const filename = event.headers['x-filename'] || ('img-' + Date.now() + '.jpg');
    const mime     = event.headers['x-mime'] || 'image/jpeg';

    // El body llega como base64 en Netlify Functions
    const buffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'binary');

    const uploadUrl = process.env.SUPABASE_URL
      + '/storage/v1/object/imagenes/'
      + filename;

    const resp = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey':        process.env.SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
        'Content-Type':  mime,
        'x-upsert':      'true'
      },
      body: buffer
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error('Supabase upload failed: ' + resp.status + ' ' + txt);
    }

    // URL pública de la imagen
    const publicUrl = process.env.SUPABASE_URL
      + '/storage/v1/object/public/imagenes/'
      + filename;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, url: publicUrl })
    };

  } catch(err) {
    console.error('upload-imagen error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
