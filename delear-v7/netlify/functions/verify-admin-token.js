/**
 * verify-admin-token.js
 * 
 * Helper compartido para verificar el token JWT simple
 * en todas las funciones protegidas del panel.
 * 
 * USO en cualquier función:
 *   const { verifyAdmin } = require('./verify-admin-token');
 *   const ok = verifyAdmin(event);
 *   if (!ok) return { statusCode: 401, ... };
 */

const crypto = require('crypto');

/**
 * Verifica el token del header x-admin-key.
 * Acepta DOS tipos de valor:
 *   1. El token firmado que genera admin-login.js  (formato: payload.sig)
 *   2. El ADMIN_KEY clásico (string simple) — para compatibilidad
 */
function verifyAdmin(event) {
  const key = event.headers['x-admin-key'] || '';
  if (!key) return false;

  const secret  = process.env.ADMIN_SECRET || process.env.ADMIN_PASS || '';
  const classicKey = process.env.ADMIN_KEY || '';

  // Compatibilidad: si es la clave clásica directa, aceptar
  if (classicKey && key === classicKey) return true;

  // Verificar token firmado: "base64Payload.base64Sig"
  const parts = key.split('.');
  if (parts.length !== 2) return false;

  const [payload, sig] = parts;

  try {
    // Verificar firma
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (sig !== expectedSig) return false;

    // Verificar expiración
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.exp || Date.now() > data.exp) return false;
    if (data.role !== 'admin') return false;

    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { verifyAdmin };
