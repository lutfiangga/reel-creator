const express = require('express');
const store = require('../db/database');
const { synthesizeSpeech } = require('../services/googleTtsService');

const router = express.Router();

router.post('/generate', async (req, res, next) => {
  try {
    const projectId = Number(req.body.project_id);
    const narration = String(req.body.narration || '').trim();
    const voiceStyle = req.body.voice_style || 'news';
    if (!projectId || !narration) return res.status(400).json({ error: 'project_id and narration are required' });
    const result = await synthesizeSpeech({ text: narration, voiceStyle, projectId });
    const total = Number((result.duration + 5).toFixed(2));
    store.projects.update(projectId, { narration, voice_style: voiceStyle, voice_path: result.voice_path, total_duration: total });
    res.json({ ...result, total_duration: total });
  } catch (err) {
    err.status = err.status || (err.message.includes('API_KEY') ? 500 : 502);
    next(err);
  }
});

module.exports = router;
