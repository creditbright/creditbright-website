const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pohsjjmcasejogfjqoth.supabase.co', process.env.SUPABASE_SERVICE_KEY);

const PRICE_MAP = {
  'price_1T7dwLFTH1AgGAu08jCWdUEc': { key: 'foundation', name: 'Credit Bright Foundation Course', amount: '89.00' },
  'price_1T7dxQFTH1AgGAu0UWFleMyJ': { key: 'getting_out_of_debt', name: 'Getting Out of Debt', amount: '49.00' },
  'price_1T7dyWFTH1AgGAu0xdKaQrcT': { key: 'negotiating_better_deals', name: 'Negotiating Better Deals', amount: '49.00' },
  'price_1T7dzXFTH1AgGAu0lR1nho5c': { key: 'bundle', name: 'Complete Credit Bright Bundle', amount: '149.00' }
};

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    var stripeEvent = JSON.parse(event.body);

    if (stripeEvent.type === 'checkout.session.completed') {
      var session = stripeEvent.data.object;
      var lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      var priceId = lineItems.data[0] && lineItems.data[0].price && lineItems.data[0].price.id;
      var productInfo = PRICE_MAP[priceId];

      if (!productInfo) return { statusCode: 200, body: 'Unknown product' };

      var product = productInfo.key;
      var userId = session.metadata && session.metadata.userId;
      var customerEmail = session.customer_email;

      if (!userId) return { statusCode: 200, body: 'No user ID' };

      var firstName = 'there';
      try {
        var result = await supabase.from('profiles').select('full_name').eq('id', userId).single();
        if (result.data && result.data.full_name) firstName = result.data.full_name.split(' ')[0];
      } catch (e) {}

      if (product === 'bundle') {
        var courses = ['foundation', 'getting_out_of_debt', 'negotiating_better_deals', 'bundle'];
        for (var i = 0; i < courses.length; i++) {
          await supabase.from('enrollments').insert({
            user_id: userId, product: courses[i], access_method: 'paid',
            stripe_payment_id: session.payment_intent, enrolled_at: new Date().toISOString()
          });
        }
      } else {
        await supabase.from('enrollments').insert({
          user_id: userId, product: product, access_method: 'paid',
          stripe_payment_id: session.payment_intent, enrolled_at: new Date().toISOString()
        });
      }

      var actualAmount = (session.amount_total / 100).toFixed(2);
      var purchaseDate = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

      try {
        await resend.emails.send({
          from: 'Credit Bright <hello@creditbright.com>',
          to: customerEmail,
          subject: 'Your Credit Bright purchase is confirmed',
          html: '<html><body style="margin:0;padding:0;background:#FAFAF8;font-family:-apple-system,sans-serif;"><table width="100%" style="background:#FAFAF8;padding:40px 20px;"><tr><td align="center"><table width="560" style="max-width:560px;width:100%;"><tr><td style="padding:0 0 32px;text-align:center;"><span style="font-size:14px;font-weight:700;letter-spacing:0.14em;color:#1A1D1A;">CREDIT BRIGHT</span></td></tr><tr><td style="background:#FFF;border:1px solid #E8E5DE;border-radius:16px;padding:40px 36px;"><h1 style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1A1D1A;margin:0 0 16px;">Purchase confirmed.</h1><p style="font-size:16px;color:#5A5F58;margin:0 0 24px;">Hi ' + firstName + ', your purchase is confirmed.</p><table width="100%" style="background:#FAFAF8;border-radius:10px;margin:0 0 24px;"><tr><td style="padding:8px 20px;font-size:15px;color:#5A5F58;">Product</td><td style="padding:8px 20px;font-size:15px;color:#1A1D1A;font-weight:600;text-align:right;">' + productInfo.name + '</td></tr><tr><td style="padding:8px 20px;font-size:15px;color:#5A5F58;">Amount</td><td style="padding:8px 20px;font-size:15px;color:#1A1D1A;font-weight:600;text-align:right;">$' + actualAmount + ' CAD</td></tr><tr><td style="padding:8px 20px;font-size:15px;color:#5A5F58;">Date</td><td style="padding:8px 20px;font-size:15px;color:#1A1D1A;font-weight:600;text-align:right;">' + purchaseDate + '</td></tr></table><a href="https://creditbright.com/website-login.html" style="display:inline-block;background:#2E7D4F;color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;">Go to Dashboard</a></td></tr><tr><td style="padding:32px 0 0;text-align:center;"><p style="font-size:13px;color:#8A8E87;margin:0;">Credit Bright. Canada\'s credit education standard.</p></td></tr></table></td></tr></table></body></html>'
        });
      } catch (emailErr) {
        console.error('Purchase email error:', emailErr.message);
      }
    }

    return { statusCode: 200, body: 'OK' };

  } catch (err) {
    console.error('Webhook error:', err.message);
    return { statusCode: 200, body: 'Error processed' };
  }
};
