# News Reel Creator

Web app untuk membuat video news reel otomatis dari topik, brand kit, asset video/image, Google TTS, DeepSeek, SQLite, dan FFmpeg.

## Struktur

```text
client/                 React, Vite, Tailwind CSS v4
server/
  index.js
  routes/               brands, projects, ai, tts, assets, render
  services/             DeepSeek, Google TTS, timeline, render queue, Python runner
  db/
    database.js
    schema.sql
  uploads/
  outputs/
  temp/
python/
  render_reel.py
  download_video.py
  transcribe.py
  detect_highlight.py
  smart_crop.py
  generate_subtitle.py
  utils.py
```

## Install

```bash
npm run setup
python -m venv .venv
.venv\Scripts\pip install -r python\requirements.txt
copy .env.example .env
```

Isi `.env`:

```env
DEEPSEEK_API_KEY=...
GOOGLE_TTS_API_KEY=...
```

## Database

```bash
npm run setup-db
```

SQLite file default: `server/news-reel.db`.

## Jalankan

```bash
npm run dev
```

Client: `http://localhost:5173`  
API: `http://localhost:3000`

## Endpoint

```text
GET    /api/brands
POST   /api/brands
PUT    /api/brands/:id
DELETE /api/brands/:id

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id

POST   /api/ai/generate-news-package
POST   /api/tts/generate

POST   /api/assets/upload
POST   /api/assets/url
PUT    /api/assets/:id
DELETE /api/assets/:id

POST   /api/render/:projectId
GET    /api/render/:projectId/status
GET    /api/render/:projectId/download
```

## Render

Render final:

- 1080x1920
- 9:16
- 30 fps
- MP4
- durasi total = voice over + 5 detik closing

Python menerima config JSON dari backend, memproses asset, trim, crop 9:16, overlay caption/logo, mux voice over, closing, lalu menulis output ke `server/outputs`.
