const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const LINK_PREVIEW_API_KEY = process.env.LINK_PREVIEW_API_KEY;

// ✅ Global CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ✅ Route: /preview?url=https://example.com
app.get('/preview', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    // Try LinkPreview.net API first
    const apiResponse = await axios.get('https://api.linkpreview.net/', {
      params: { key: LINK_PREVIEW_API_KEY, q: url },
      timeout: 8000,
    });

    if (apiResponse.data && !apiResponse.data.error) {
      return res.json(apiResponse.data);
    } else {
      console.warn('LinkPreview API failed, falling back:', apiResponse.data.error);
    }
  } catch (error) {
    console.warn('LinkPreview API unavailable, using fallback:', error.message);
  }

  // ✅ Fallback: Scrape site manually with cheerio
  try {
    const htmlResponse = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(htmlResponse.data);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      '';
    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';
    const image =
      $('meta[property="og:image"]').attr('content') ||
      $('img').first().attr('src') ||
      '';

    const previewData = {
      title: title.trim() || 'No title found',
      description: description.trim() || 'No description found',
      image: image.startsWith('http') ? image : new URL(image, url).href,
      url,
    };

    res.json(previewData);
  } catch (scrapeError) {
    console.error('Fallback scraping failed:', scrapeError.message);
    res.status(500).json({ error: 'Could not fetch preview' });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ LinkPreview + fallback server running on port ${PORT}`);
});
