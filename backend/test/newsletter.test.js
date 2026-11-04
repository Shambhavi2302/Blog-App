const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeSmtpConfig } = require('../controller/newsletterController');

test('normalizeSmtpConfig strips spaces from Gmail app passwords and trims config values', () => {
  const config = normalizeSmtpConfig({
    SMTP_HOST: ' smtp.gmail.com ',
    SMTP_PORT: ' 587 ',
    SMTP_USER: ' shambhavi23032002@gmail.com ',
    SMTP_PASS: ' mdyu pnjt jsrc neuo ',
  });

  assert.equal(config.host, 'smtp.gmail.com');
  assert.equal(config.port, 587);
  assert.equal(config.user, 'shambhavi23032002@gmail.com');
  assert.equal(config.pass, 'mdyupnjtjsrcneuo');
});
