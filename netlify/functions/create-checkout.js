const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  try {
    const { priceId, userId, userEmail, userName, successUrl, cancelUrl } = JSON.parse(event.body);
    if (!priceId || !userEmail) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    // Find or create Stripe customer so name is pre-filled on checkout
    let customer;
    const existing = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (existing.data.length > 0) {
      customer = existing.data[0];
      // Update name if we have one and they don't
      if (userName && !customer.name) {
        customer = await stripe.customers.update(customer.id, { name: userName });
      }
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        name: userName || undefined,
        metadata: { userId: userId || '' }
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: customer.id,
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || 'https://creditbright.com/website-dashboard.html?purchase=success',
      cancel_url: cancelUrl || 'https://creditbright.com/website-dashboard.html?purchase=cancelled',
      metadata: { userId: userId || '' }
    });
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
