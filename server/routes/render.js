const path = require('path');
const express = require('express');
const store = require('../db/database');
const { enqueue } = require('../services/renderQueue');

const router = express.Router();

router.post('/:projectId', (req, res) => {
  const project = store.projects.get(req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (!project.voice_path) return res.status(400).json({ error: 'Generate voice over before render' });
  if (!project.assets.length) return res.status(400).json({ error: 'Add at least one asset before render' });
  res.status(202).json(enqueue(Number(req.params.projectId)));
});

router.get('/:projectId/status', (req, res) => {
  res.json(store.jobs.latest(req.params.projectId) || { status: 'idle', progress: 0 });
});

router.get('/:projectId/download', (req, res) => {
  const project = store.projects.get(req.params.projectId);
  if (!project?.output_path) return res.status(404).json({ error: 'Output not found' });
  res.download(path.join(__dirname, '..', project.output_path));
});

module.exports = router;
