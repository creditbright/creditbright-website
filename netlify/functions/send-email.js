const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

var emailWrapper = function(content) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background:#FAFAF8;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:40px 20px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;"><tr><td style="padding:0 0 32px;text-align:center;"><span style="font-size:14px;font-weight:700;letter-spacing:0.14em;color:#1A1D1A;">CREDIT BRIGHT</span></td></tr><tr><td style="background:#FFFFFF;border:1px solid #E8E5DE;border-radius:16px;padding:40px 36px;">' + content + '</td></tr><tr><td style="padding:32px 0 0;text-align:center;"><p style="font-size:13px;color:#8A8E87;margin:0 0 8px;">Credit Bright. Canada\'s credit education standard.</p></td></tr></table></td></tr></table></body></html>';
};

var TEMPLATES = {
  welcome: function(firstName) {
    return {
      subject: 'Welcome to Credit Bright',
      html: emailWrapper('<h1 style="font-family:Georgia,Times New Roman,serif;font-size:26px;font-weight:400;color:#1A1D1A;margin:0 0 16px;">Welcome, ' + firstName + '.</h1><p style="font-size:16px;line-height:1.7;color:#5A5F58;margin:0 0 16px;">Your account is ready.</p><p style="font-size:16px;line-height:1.7;color:#5A5F58;margin:0 0 16px;">You now have access to Canada\'s credit education platform: three courses, three interactive tools, and a credential that proves you understand how credit works.</p><p style="font-size:16px;line-height:1.7;color:#5A5F58;margin:0 0 24px;">Here is what is waiting for you: the Credit Bright Foundation Course, Getting Out of Debt, Negotiating Better Deals, plus the Credit Calculator, Credit Simulator, and AI Credit Advisor.</p><a href="https://creditbright.com/website-login.html" style="display:inline-block;background:#2E7D4F;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;">Log In</a>')
    };
  },
  purchase: function(firstName, productName, amount, date) {
    return {
      subject: 'Your Credit Bright purchase is confirmed',
      html: emailWrapper('<h1 style="font-family:Georgia,Times New Roman,serif;font-size:26px;font-weight:400;color:#1A1D1A;margin:0 0 16px;">Purchase confirmed.</h1><p style="font-size:16px;line-height:1.7;color:#5A5F58;margin:0 0 24px;">Hi ' + firstName + ', your purchase is confirmed.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;border-radius:10px;margin:0 0 24px;"><tr><td style="padding:8px 20px;font-size:15px;color:#5A5F58;">Product</td><td style="padding:8px 20px;font-size:15px;color:#1A1D1A;font-weight:600;text-align:right;">' + productName + '</td></tr><tr><td style="padding:8px 20px;font-size:15px;color:#5A5F58;">Amount</td><td style="padding:8px 20px;font-size:15px;color:#1A1D1A;font-weight:600;text-align:right;">$' + amount + ' CAD</td></tr><tr><td style="padding:8px 20px;font-size:15px;color:#5A5F58;">Date</td><td style="padding:8px 20px;font-size:15px;color:#1A1D1A;font-weight:600;text-align:right;">' + date + '</td></tr></table><a href="https://creditbright.com/website-login.html" style="display:inline-block;background:#2E7D4F;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;">Go to Dashboard</a>')
    };
  },
  certificate: function(firstName, certName, subjectArea, preScore, postScore) {
    return {
      subject: 'Congratulations. You earned your ' + certName + '.',
      html: emailWrapper('<h1 style="font-family:Georgia,Times New Roman,serif;font-size:26px;font-weight:400;color:#1A1D1A;margin:0 0 16px;">You passed.</h1><p style="font-size:16px;line-height:1.7;color:#5A5F58;margin:0 0 24px;">Hi ' + firstName + ', your ' + certName + ' has been issued.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#E8F5EC;border-radius:10px;margin:0 0 24px;"><tr><td style="padding:8px 20px;font-size:15px;color:#5A5F58;">Pre-assessment score</td><td style="padding:8px 20px;font-size:15px;color:#1A1D1A;font-weight:600;text-align:right;">' + preScore + '%</td></tr><tr><td style="padding:8px 20px;font-size:15px;color:#5A5F58;">Post-assessment score</td><td style="padding:8px 20px;font-size:15px;color:#2E7D4F;font-weight:600;text-align:right;">' + postScore + '%</td></tr></table><p style="font-size:16px;line-height:1.7;color:#5A5F58;margin:0 0 24px;">This credential demonstrates real competence in ' + subjectArea + '. It goes in your file. It proves you know how credit works in Canada.</p><a href="https://creditbright.com/website-login.html" style="display:inline-block;background:#2E7D4F;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;">View Certificate</a>')
    };
  }
};

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    var body = JSON.parse(event.body);
    var type = body.type;
    var to = body.to;
    var template;

    if (type === 'welcome') {
      template = TEMPLATES.welcome(body.firstName);
    } else if (type === 'purchase') {
      template = TEMPLATES.purchase(body.firstName, body.productName, body.amount, body.date);
    } else if (type === 'certificate') {
      template = TEMPLATES.certificate(body.firstName, body.certName, body.subjectArea, body.preScore, body.postScore);
    } else if (type === 'contact') {
      var contactHtml = emailWrapper('<h1 style="font-family:Georgia,Times New Roman,serif;font-size:26px;font-weight:400;color:#1A1D1A;margin:0 0 16px;">New contact form message</h1><table width="100%" style="background:#FAFAF8;border-radius:10px;margin:0 0 24px;"><tr><td style="padding:8px 20px;font-size:15px;color:#5A5F58;">Name</td><td style="padding:8px 20px;font-size:15px;color:#1A1D1A;font-weight:600;text-align:right;">' + body.name + '</td></tr><tr><td style="padding:8px 20px;font-size:15px;color:#5A5F58;">Email</td><td style="padding:8px 20px;font-size:15px;color:#1A1D1A;font-weight:600;text-align:right;">' + body.email + '</td></tr><tr><td style="padding:8px 20px;font-size:15px;color:#5A5F58;">Type</td><td style="padding:8px 20px;font-size:15px;color:#1A1D1A;font-weight:600;text-align:right;">' + (body.contactType || 'Not specified') + '</td></tr></table><p style="font-size:16px;line-height:1.7;color:#5A5F58;margin:0 0 8px;font-weight:600;">Message:</p><p style="font-size:16px;line-height:1.7;color:#5A5F58;margin:0;">' + body.message.replace(/\n/g, '<br>') + '</p>');

      var result = await resend.emails.send({
        from: 'Credit Bright <hello@creditbright.com>',
        to: ['ykarov@creditbright.com', 'matt@creditbright.com'],
        replyTo: body.email,
        subject: 'Contact form: ' + body.name + ' (' + (body.contactType || 'General') + ')',
        html: contactHtml
      });

      return { statusCode: 200, headers: headers, body: JSON.stringify({ success: true, id: result.data?.id }) };
    } else {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Unknown email type' }) };
    }

    var result = await resend.emails.send({
      from: 'Credit Bright <hello@creditbright.com>',
      to: to,
      subject: template.subject,
      html: template.html
    });

    return { statusCode: 200, headers: headers, body: JSON.stringify({ success: true, id: result.data?.id }) };

  } catch (err) {
    console.error('Email error:', err);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: err.message }) };
  }
};
