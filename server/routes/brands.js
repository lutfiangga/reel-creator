const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const store = require('../db/database');

const router = express.Router();
const uploadRoot = path.join(__dirname, '..', 'uploads', 'brand');
fs.mkdirSync(uploadRoot, { recursive: true });
const safeName = (name) => path.basename(name).replace(/[^a-z0-9._-]/gi, '_').slice(-120);
const colorOrDefault = (value) => /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#ef4444';
const animations = new Set(['none', 'fade-in', 'fade-out', 'zoom-in', 'zoom-out', 'slide-up', 'slide-down', 'slide-left', 'slide-right']);
const textCases = new Set(['none', 'uppercase', 'lowercase', 'capitalize']);
const outlineModes = new Set(['inner', 'outer', 'center']);
const fontWeights = new Set(['100', '200', '300', '400', '500', '600', '700', '800', '900']);
const fontStyles = new Set(['normal', 'italic']);
const animation = (value) => animations.has(value) ? value : 'none';
const textCase = (value) => textCases.has(value) ? value : 'none';
const outlineMode = (value) => outlineModes.has(value) ? value : 'center';
const fontWeight = (value) => fontWeights.has(String(value)) ? String(value) : '700';
const fontStyle = (value) => fontStyles.has(value) ? value : 'normal';
const duration = (value) => Math.max(0.1, Math.min(10, Number(value || 1)));
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadRoot),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeName(file.originalname)}`),
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const ok = file.mimetype.startsWith('image/') || ['.ttf', '.otf', '.woff', '.woff2'].includes(ext);
    cb(ok ? null : new Error('Only image and font files are allowed'), ok);
  },
});

const pick = (body) => ({
  name: String(body.name || '').trim(),
  logo_top: body.logo_top || null,
  overlay_path: body.overlay_path || null,
  logo_end: body.logo_end || null,
  caption_style: body.caption_style || 'bold',
  caption_text_color: colorOrDefault(body.caption_text_color || '#ffffff'),
  caption_bg_color: colorOrDefault(body.caption_bg_color || '#000000'),
  caption_outline_color: colorOrDefault(body.caption_outline_color || '#000000'),
  caption_outline_width: Math.max(0, Math.min(20, Number(body.caption_outline_width || 0))),
  caption_outline_mode: outlineMode(body.caption_outline_mode),
  caption_font_size: Math.max(12, Math.min(120, Number(body.caption_font_size || 46))),
  caption_font_weight: fontWeight(body.caption_font_weight),
  caption_font_style: fontStyle(body.caption_font_style),
  caption_text_case: textCase(body.caption_text_case),
  caption_letter_spacing: Math.max(-10, Math.min(30, Number(body.caption_letter_spacing || 0))),
  caption_active_padding: Math.max(0, Math.min(40, Number(body.caption_active_padding || 8))),
  caption_active_radius: Math.max(0, Math.min(40, Number(body.caption_active_radius || 6))),
  caption_position: body.caption_position || '50,78',
  font_family: body.font_family || 'Plus Jakarta Sans',
  font_path: body.font_path || null,
  primary_color: colorOrDefault(body.primary_color),
  logo_position: body.logo_position || 'top-right',
  logo_top_scale: Math.max(0.1, Math.min(5, Number(body.logo_top_scale || 1))),
  logo_end_scale: Math.max(0.1, Math.min(5, Number(body.logo_end_scale || 1))),
  logo_top_in_animation: animation(body.logo_top_in_animation),
  logo_top_in_duration: duration(body.logo_top_in_duration),
  logo_top_out_animation: animation(body.logo_top_out_animation),
  logo_top_out_duration: duration(body.logo_top_out_duration),
  logo_end_in_animation: animation(body.logo_end_in_animation),
  logo_end_in_duration: duration(body.logo_end_in_duration),
  logo_end_out_animation: animation(body.logo_end_out_animation),
  logo_end_out_duration: duration(body.logo_end_out_duration),
  thumbnail_font_family: body.thumbnail_font_family || 'Bungee',
  thumbnail_bg_color: colorOrDefault(body.thumbnail_bg_color || '#001dff'),
  thumbnail_text_color: colorOrDefault(body.thumbnail_text_color || '#ffffff'),
  thumbnail_font_size: Math.max(12, Math.min(120, Number(body.thumbnail_font_size || 46))),
  thumbnail_font_weight: fontWeight(body.thumbnail_font_weight),
  thumbnail_font_style: fontStyle(body.thumbnail_font_style),
  thumbnail_text_case: textCase(body.thumbnail_text_case),
  thumbnail_outline_color: colorOrDefault(body.thumbnail_outline_color || '#000000'),
  thumbnail_outline_width: Math.max(0, Math.min(20, Number(body.thumbnail_outline_width || 0))),
  thumbnail_letter_spacing: Math.max(-10, Math.min(30, Number(body.thumbnail_letter_spacing || 0))),
  thumbnail_position: body.thumbnail_position || '8,28',
});

router.get('/', (_req, res) => res.json(store.brands.all()));

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' });
  res.status(201).json({
    path: path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/'),
    mimetype: req.file.mimetype,
  });
});

router.post('/', (req, res) => {
  const data = pick(req.body);
  if (!data.name) return res.status(400).json({ error: 'Brand name is required' });
  res.status(201).json(store.brands.get(store.brands.create(data)));
});

router.put('/:id', (req, res) => {
  const data = pick(req.body);
  if (!data.name) return res.status(400).json({ error: 'Brand name is required' });
  store.brands.update(req.params.id, data);
  res.json(store.brands.get(req.params.id));
});

router.delete('/:id', (req, res) => {
  store.brands.delete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
