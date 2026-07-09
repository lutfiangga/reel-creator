const path = require('path');
const express = require('express');
const multer = require('multer');
const store = require('../db/database');
const { calculateTimeline } = require('../services/timeline');

const router = express.Router();
const root = path.join(__dirname, '..', 'uploads', 'assets');
require('fs').mkdirSync(root, { recursive: true });
const safeName = (name) => path.basename(name).replace(/[^a-z0-9._-]/gi, '_').slice(-120);
const allowed = new Set(['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, root),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeName(file.originalname)}`),
  }),
  limits: { fileSize: 250 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(allowed.has(file.mimetype) ? null : new Error('Unsupported file type'), allowed.has(file.mimetype)),
});

function recalc(projectId) {
  const project = store.projects.get(projectId);
  if (!project) return;
  calculateTimeline(project.total_duration, project.assets).forEach((asset) => {
    store.assets.update(asset.id, { calculated_duration: asset.calculated_duration, order_index: asset.order_index });
  });
}

function assetPayload(body, extra = {}) {
  return {
    project_id: Number(body.project_id),
    type: body.type,
    source_type: body.source_type,
    source_path: body.source_path || null,
    url: body.url || null,
    trim_start: Number(body.trim_start || 0),
    trim_end: body.trim_end ? Number(body.trim_end) : null,
    custom_duration: body.custom_duration ? Number(body.custom_duration) : null,
    calculated_duration: body.calculated_duration ? Number(body.calculated_duration) : 0,
    order_index: body.order_index ? Number(body.order_index) : 0,
    ...extra,
  };
}

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' });
  const type = req.file.mimetype.startsWith('image/') ? 'image' : req.file.mimetype.startsWith('audio/') ? 'audio' : 'video';
  const id = store.assets.create(assetPayload(req.body, {
    type,
    source_type: 'upload',
    source_path: path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/'),
  }));
  recalc(req.body.project_id);
  res.status(201).json(store.projects.get(req.body.project_id).assets.find((asset) => asset.id === id));
});

router.post('/url', (req, res) => {
  const projectId = Number(req.body.project_id);
  const url = String(req.body.url || '').trim();
  if (!projectId || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Valid project_id and public URL are required' });
  const id = store.assets.create(assetPayload(req.body, { project_id: projectId, type: 'video', source_type: 'url', url }));
  recalc(projectId);
  res.status(201).json(store.projects.get(projectId).assets.find((asset) => asset.id === id));
});

router.put('/:id', (req, res) => {
  const current = store.db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Asset not found' });
  store.assets.update(req.params.id, assetPayload({ ...current, ...req.body }));
  recalc(current.project_id);
  res.json(store.db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const current = store.db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Asset not found' });
  store.assets.delete(req.params.id);
  recalc(current.project_id);
  res.json({ ok: true });
});

module.exports = router;
