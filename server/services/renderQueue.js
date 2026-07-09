const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const store = require('../db/database');
const { calculateTimeline } = require('./timeline');
const { runPython } = require('./pythonRunner');

let busy = false;
const queue = [];

function absFromServer(relativePath) {
  return relativePath ? path.join(__dirname, '..', relativePath) : null;
}

function buildConfig(project) {
  const assets = calculateTimeline(project.total_duration, project.assets).map((asset) => ({
    ...asset,
    source_path: absFromServer(asset.source_path),
  }));
  const output = path.join(__dirname, '..', 'outputs', `project-${project.id}.mp4`);
  return {
    project_id: project.id,
    narration: project.narration || '',
    thumbnail_title: project.thumbnail_title || project.title,
    thumbnail_image: absFromServer(project.thumbnail_image),
    voice_path: absFromServer(project.voice_path),
    brand: project.brand ? {
      ...project.brand,
      logo_top: absFromServer(project.brand.logo_top),
      overlay_path: absFromServer(project.brand.overlay_path),
      logo_end: absFromServer(project.brand.logo_end),
      font_path: absFromServer(project.brand.font_path),
    } : {},
    assets,
    caption_style: project.brand?.caption_style || 'bold',
    output_path: output,
    total_duration: Number(project.total_duration || 0),
    ffmpeg_path: ffmpegPath,
  };
}

async function processNext() {
  if (busy || !queue.length) return;
  busy = true;
  const { jobId, projectId } = queue.shift();
  try {
    store.jobs.update(jobId, { status: 'running', progress: 5, started_at: store.now() });
    store.projects.update(projectId, { status: 'rendering' });
    const project = store.projects.get(projectId);
    if (!project) throw new Error('Project not found');
    const config = buildConfig(project);
    const configFile = path.join(__dirname, '..', 'temp', `render-${projectId}-${jobId}.json`);
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    const result = await runPython('render_reel.py', [configFile], (progress) => store.jobs.update(jobId, { progress }));
    const outputPath = path.relative(path.join(__dirname, '..'), result.output_path || config.output_path).replace(/\\/g, '/');
    store.jobs.update(jobId, { status: 'completed', progress: 100, finished_at: store.now() });
    store.projects.update(projectId, { status: 'completed', output_path: outputPath });
  } catch (err) {
    store.jobs.update(jobId, { status: 'failed', error_message: err.message, finished_at: store.now() });
    store.projects.update(projectId, { status: 'failed' });
  } finally {
    busy = false;
    processNext();
  }
}

function enqueue(projectId) {
  const jobId = store.jobs.create(projectId);
  queue.push({ jobId, projectId });
  processNext();
  return store.jobs.latest(projectId);
}

module.exports = { enqueue };
