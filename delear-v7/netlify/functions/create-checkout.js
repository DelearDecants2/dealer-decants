const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items, envio, descuento } = JSON.parse(event.body);

    const lineItems = items.map(function(item) {
      var nombre = item.esCombo
        ? item.nombre + ' (Combo ' + item.ml + ' c/u)'
        : item.nombre + ' - ' + (item.label || item.ml);
      if(nombre.length > 250) nombre = nombre.substring(0, 247) + '...';
      return {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: nombre,
            description: (item.esCombo
              ? 'Set: ' + (item.nombresPerfumes || []).join(', ')
              : (item.marca || '')).substring(0, 500),
          },
          unit_amount: Math.round(item.precio * 100),
        },
        quantity: item.qty,
      };
    });

    if (envio > 0) {
      lineItems.push({
        price_data: {
          currency: 'mxn',
          product_data: { name: 'Envio a Mexico (3-5 dias habiles)' },
          unit_amount: envio * 100,
        },
        quantity: 1,
      });
    }

    if (descuento > 0) {
      lineItems.push({
        price_data: {
          currency: 'mxn',
          product_data: { name: 'Descuento aplicado' },
          unit_amount: -Math.round(descuento * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: 'https://dealerdecants.netlify.app/?pago=exitoso',
      cancel_url:  'https://dealerdecants.netlify.app/?pago=cancelado',
      shipping_address_collection: { allowed_countries: ['MX'] },
      phone_number_collection: { enabled: true },
      locale: 'es',
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };

  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};