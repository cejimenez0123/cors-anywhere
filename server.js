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

app.get('/preview', async (req, res) => {
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

// app.get('/preview', async (req, res) => {
//   const { url } = req.query;
//   if (!url) {
//     return res.status(400).json({ error: 'Missing URL parameter' });
//   }

//   try {
//     const response = await axios.get('https://api.linkpreview.net/', {
//       params: {
//         key: LINK_PREVIEW_API_KEY,
//         q: url,
//       },
//     });

//     res.json(response.data);
//   } catch (error) {
//     console.error('Link preview error:', error.message);
//     res.status(500).json({ error: 'Failed to fetch preview' });
//   }
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
