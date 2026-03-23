const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let session;
  try {
    // Si tienes webhook secret configurado en Stripe, verifica la firma
    // Por ahora parseamos directo (agregar verificación después)
    const body = JSON.parse(event.body);
    if (body.type !== 'checkout.session.completed') {
      return { statusCode: 200, body: 'ok' };
    }
    session = body.data.object;
  } catch(err) {
    return { statusCode: 400, body: 'Bad Request' };
  }

  try {
    // Armar mensaje de WhatsApp para ti (el dueño)
    const shipping = session.shipping_details || {};
    const addr = shipping.address || {};
    const nombre = shipping.name || session.metadata?.nombre || 'Cliente';
    const telefono = session.metadata?.telefono || '—';
    const items = session.metadata?.items || '—';
    const total = (session.amount_total / 100).toLocaleString('es-MX');

    const msg = `🛒 *NUEVO PEDIDO CON TARJETA* 🎉\n\n`+
      `👤 ${nombre}\n`+
      `📱 ${telefono}\n`+
      `📍 ${addr.line1||''} ${addr.line2||''}, ${addr.city||''}, ${addr.state||''} C.P. ${addr.postal_code||''}\n\n`+
      `🛍️ ${items}\n\n`+
      `✅ TOTAL PAGADO: $${total} MXN\n`+
      `💳 Pago con tarjeta confirmado por Stripe`;

    const wha = process.env.WHA_NUMBER || '5215539250084';
    const url = `https://api.whatsapp.com/send?phone=${wha}&text=${encodeURIComponent(msg)}`;

    // Llamar a CallMeBot API para mandar WhatsApp automático
    // (Necesitas registrarte en callmebot.com gratis)
    const apiKey = process.env.CALLMEBOT_KEY;
    if (apiKey) {
      await fetch(`https://api.callmebot.com/whatsapp.php?phone=${wha}&text=${encodeURIComponent(msg)}&apikey=${apiKey}`);
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch(err) {
    console.error('Webhook error:', err);
    return { statusCode: 500, body: err.message };
  }
};
