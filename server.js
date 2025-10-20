// // Listen on a specific host via the HOST environment variable
// var host = process.env.HOST || '0.0.0.0';
// // Listen on a specific port via the PORT environment variable
// var port = process.env.PORT || 8080;

// // Grab the blacklist from the command-line so that we can update the blacklist without deploying
// // again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// // immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// // use originWhitelist instead.
// var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
// var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
// function parseEnvList(env) {
//   if (!env) {
//     return [];
//   }
//   return env.split(',');
// }

// // Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
// var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

// var cors_proxy = require('./lib/cors-anywhere');
// cors_proxy.createServer({
//   originBlacklist: originBlacklist,
//   originWhitelist: originWhitelist,
//   requireHeader: ['origin', 'x-requested-with'],
//   checkRateLimit: checkRateLimit,
//   removeHeaders: [
//     'cookie',
//     'cookie2',
//     // Strip Heroku-specific headers
//     'x-request-start',
//     'x-request-id',
//     'via',
//     'connect-time',
//     'total-route-time',
//     // Other Heroku added debug headers
//     // 'x-forwarded-for',
//     // 'x-forwarded-proto',
//     // 'x-forwarded-port',
//   ],
//   redirectSameOrigin: true,
//   httpProxyOptions: {
//     // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
//     xfwd: false,
//   },
// }).listen(port, host, function() {
//   console.log('Running CORS Anywhere on ' + host + ':' + port);
// });
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors_proxy = require('./lib/cors-anywhere');
// optional if you keep env vars

const app = express();
const PORT = process.env.NODE_PORT || 8881;
const LINKPREVIEW = process.env.NODE_LINK_PREVIEW_API_KEY; // set in env
// Optional: CORS headers for your frontend
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Link preview route
app.get('/preview', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    // Use LinkPreview.net API
    const response = await fetch(`https://api.linkpreview.net/?key=${LINK_PREVIEW_API_KEY}&q=${encodeURIComponent(url)}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Link preview error:', error);
    res.status(500).json({ error: 'Failed to fetch preview' });
  }
});

// Fallback: normal CORS proxy
cors_proxy.createServer({
  removeHeaders: ['cookie', 'cookie2'],
}).listen(PORT,() => {
  console.log(`CORS Anywhere + LinkPreview server running on port ${PORT}`);
});

app.listen(PORT, () => console.log(`Express server running on port ${PORT}`));
