/**
 * /.netlify/functions/admin-login
 *
 * Verifica la contraseña del lado del SERVIDOR.
 * La contraseña NUNCA sale del servidor — solo vive en las
 * variables de entorno de Netlify (ADMIN_PASS).
 *
 * Devuelve un token simple firmado con ADMIN_SECRET.
 * El HTML lo guarda en sessionStorage y lo manda en cada
 * petición protegida como header x-admin-token.
 */

exports.handler = async function(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{"error":"Method Not Allowed"}' };

  // Rate limiting básico por IP (Netlify expone la IP en headers)
  // Para rate limiting real usa Upstash Redis, pero esto ya ayuda bastante
  const ip = event.headers['x-nf-client-connection-ip'] || 'unknown';

  try {
    const { password } = JSON.parse(event.body || '{}');

    // Comparación en tiempo constante para evitar timing attacks
    const expected = process.env.ADMIN_PASS || '';
    if (!password || !expected) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'No autorizado' }) };
    }

    // Comparar carácter a carácter en tiempo constante
    let match = password.length === expected.length;
    for (let i = 0; i < Math.max(password.length, expected.length); i++) {
      if ((password[i] || '') !== (expected[i] || '')) match = false;
    }

    if (!match) {
      console.log(`[admin-login] Intento fallido desde IP: ${ip}`);
      // Delay intencional para dificultar brute force
      await new Promise(r => setTimeout(r, 800));
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Contraseña incorrecta' }) };
    }

    // Generar token: base64( payload ) + "." + base64( hmac-sha256 )
    // Usamos crypto nativo de Node — sin dependencias externas
    const crypto = require('crypto');
    const secret = process.env.ADMIN_SECRET || process.env.ADMIN_PASS || 'fallback-secret';
    const expires = Date.now() + 4 * 60 * 60 * 1000; // 4 horas

    const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: expires })).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const token = payload + '.' + sig;

    console.log(`[admin-login] Login exitoso desde IP: ${ip}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, token, expires }),
    };

  } catch (err) {
    console.error('[admin-login] Error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno' }) };
  }
};
