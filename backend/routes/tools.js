const express = require('express');
const https = require('https');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/breach-check', (req, res) => {
  const { prefix } = req.query;

  if (!prefix || !/^[A-F0-9]{5}$/i.test(prefix)) {
    return res.status(400).json({ error: 'prefix must be exactly 5 hex characters' });
  }

  const options = {
    hostname: 'api.pwnedpasswords.com',
    path: `/range/${prefix.toUpperCase()}`,
    method: 'GET',
    headers: {
      'Add-Padding': 'true',
      'User-Agent': 'VaultX-PasswordManager',
    },
  };

  const request = https.request(options, (hibpRes) => {
    let data = '';
    hibpRes.on('data', (chunk) => { data += chunk; });
    hibpRes.on('end', () => {
      res.set('Content-Type', 'text/plain');
      res.send(data);
    });
  });

  request.on('error', (err) => {
    console.error('HIBP proxy error:', err);
    res.status(502).json({ error: 'Failed to reach breach database' });
  });

  request.end();
});

module.exports = router;
