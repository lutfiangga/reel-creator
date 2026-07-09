const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const store = require('../db/database');

const router = express.Router();
const uploadRoot = path.join(__dirname, '..', 'uploads', 'thumbnail');
fs.mkdirSync(uploadRoot, { recursive: true });
const safeName = (name) => path.basename(name).replace(/[^a-z0-9._-]/gi, '_').slice(-120);
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadRoot),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeName(file.originalname)}`),
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(file.mimetype.startsWith('image/') ? null : new Error('Only image files are allowed'), file.mimetype.startsWith('image/')),
});

function payload(body) {
  return {
    title: String(body.title || body.thumbnail_title || body.topic || 'Untitled reel').trim(),
    topic: String(body.topic || '').trim(),
    narration: body.narration || '',
    thumbnail_image: body.thumbnail_image || null,
    thumbnail_title: body.thumbnail_title || '',
    post_caption: body.post_caption || '',
    hashtags: Array.isArray(body.hashtags) ? body.hashtags : [],
    brand_id: body.brand_id || null,
    voice_style: body.voice_style || 'news',
    voice_path: body.voice_path || null,
    total_duration: Number(body.total_duration || 0),
    status: body.status || 'draft',
    output_path: body.output_path || null,
  };
}

router.get('/', (_req, res) => res.json(store.projects.all()));

router.post('/upload-thumbnail', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' });
  res.status(201).json({ path: path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/') });
});

router.post('/', (req, res) => {
  const data = payload(req.body);
  if (!data.topic) return res.status(400).json({ error: 'Topic is required' });
  const id = store.projects.create(data);
  res.status(201).json(store.projects.get(id));
});

router.get('/:id', (req, res) => {
  const project = store.projects.get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

router.put('/:id', (req, res) => {
  if (!store.projects.get(req.params.id)) return res.status(404).json({ error: 'Project not found' });
  store.projects.update(req.params.id, payload(req.body));
  res.json(store.projects.get(req.params.id));
});

router.delete('/:id', (req, res) => {
  store.projects.delete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
