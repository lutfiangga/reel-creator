const express = require('express');
const { generateNewsPackage } = require('../services/deepseekService');

const router = express.Router();

router.post('/generate-news-package', async (req, res, next) => {
  try {
    const topic = String(req.body.topic || '').trim();
    const tone = req.body.tone || 'news_reel';
    if (!topic) return res.status(400).json({ error: 'Topic is required' });
    res.json(await generateNewsPackage({ topic, tone }));
  } catch (err) {
    err.status = err.status || (err.message.includes('API_KEY') ? 500 : 502);
    next(err);
  }
});

module.exports = router;
