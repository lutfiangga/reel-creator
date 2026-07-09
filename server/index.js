const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

function loadEnv() {
  const file = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^"|"$/g, '');
  }
}

loadEnv();

const app = express();
const PORT = process.env.PORT || 3000;

for (const dir of ['uploads', 'outputs', 'temp']) {
  fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

app.use('/api/brands', require('./routes/brands'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/tts', require('./routes/tts'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/render', require('./routes/render'));

app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'news-reel-creator' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`News Reel Creator API http://localhost:${PORT}`));
