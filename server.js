import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const LINK_PREVIEW_API_KEY = process.env.LINK_PREVIEW_API_KEY;

// ✅ Allow requests from any origin (or restrict later to your frontend)
app.use(cors({
  origin: '*', // or replace with: ['https://your-frontend-domain.com']
}));
const cache = new Map();

app.get('api/preview', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing URL parameter' });

  // Check cache
  if (cache.has(url)) {
    return res.json(cache.get(url));
  }

  try {
    const response = await axios.get('https://api.linkpreview.net/', {
      params: { key: LINK_PREVIEW_API_KEY, q: url },
    });

    // Cache it for 1 hour
    cache.set(url, response.data);
    setTimeout(() => cache.delete(url), 60 * 60 * 1000);

    res.json(response.data);
  } catch (error) {
    console.error('Link preview error:', error.response?.status || error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch preview' });
  }
});
app.get("/preview", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing URL parameter" });

  // Check cache
  if (cache.has(url)) {
    return res.json(cache.get(url));
  }

  try {
    const { data } = await axios.get(url, {
      headers: {
        // Simulate a real browser for sites that block bots
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
      },
      timeout: 8000,
    });

    const $ = cheerio.load(data);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      "";
    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";
    const image =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      "";

    const preview = {
      url,
      title,
      description,
      image,
    };

    // Cache it for 1 hour
    cache.set(url, preview);
    setTimeout(() => cache.delete(url), 60 * 60 * 1000);

    res.json(preview);
  } catch (error) {
    console.error("Link preview error:", error.message);
    res.status(500).json({ error: "Failed to fetch preview" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
