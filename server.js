const express = require('express');
const axios = require('axios');
const cors_proxy = require('./lib/cors-anywhere');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 8080;
const LINK_PREVIEW_API_KEY = process.env.LINK_PREVIEW_API_KEY;
console.log('Link Preview API Key:', LINK_PREVIEW_API_KEY ? 'Loaded' : 'Not Found');
// CORS headers for frontend
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
    const response = await axios.get('https://api.linkpreview.net/', {
      params: { key: LINK_PREVIEW_API_KEY, q: url }
    });
    console.log(response.data)
    res.json(response.data);
  } catch (error) {
    console.error('Link preview error:', error.message);
    res.status(500).json({ error: 'Failed to fetch preview' });
  }
});

// Start CORS Anywhere fallback proxy
cors_proxy.createServer({
  removeHeaders: ['cookie', 'cookie2'],
}).listen(PORT, '0.0.0.0', () => {
  console.log(`CORS Anywhere + LinkPreview server running on port ${PORT}`);
});
