import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ai, mediaUrl, projects, render, tts } from '../lib/api';
import AssetTrimEditor from '../components/AssetTrimEditor';
import AssetUploader from '../components/AssetUploader';
import BrandSelector from '../components/BrandSelector';
import RenderStatus from '../components/RenderStatus';
import TimelinePreview from '../components/TimelinePreview';
import VoiceStylePicker from '../components/VoiceStylePicker';

const emptyPackage = { narration: '', thumbnail_title: '', post_caption: '', hashtags: [] };

export default function ProjectCreate() {
  const nav = useNavigate();
  const [topic, setTopic] = useState('');
  const [pkg, setPkg] = useState(emptyPackage);
  const [brandId, setBrandId] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('news');
  const [project, setProject] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function generate() {
    setBusy('Generating content');
    setError('');
    try { setPkg(await ai.generate({ topic, tone: 'news_reel' })); } catch (err) { setError(err.response?.data?.error || err.message); }
    setBusy('');
  }

  async function saveProject(extra = {}) {
    const payload = { topic, title: pkg.thumbnail_title || topic, ...pkg, brand_id: brandId || null, voice_style: voiceStyle, ...extra };
    const saved = project ? await projects.update(project.id, { ...project, ...payload }) : await projects.create(payload);
    setProject(saved);
    return saved;
  }

  async function uploadThumbnail(file) {
    if (!file) return;
    setThumbnailPreview(URL.createObjectURL(file));
    const form = new FormData();
    form.append('file', file);
    try {
      const result = await projects.uploadThumbnail(form);
      const saved = await saveProject({ thumbnail_image: result.path });
      setProject(saved);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  async function generateVoice() {
    setBusy('Generating voice');
    const saved = await saveProject();
    try {
      await tts.generate({ project_id: saved.id, narration: pkg.narration, voice_style: voiceStyle });
      setProject(await projects.get(saved.id));
    } catch (err) { setError(err.response?.data?.error || err.message); }
    setBusy('');
  }

  async function refresh() {
    if (project) setProject(await projects.get(project.id));
  }

  async function startRender() {
    setBusy('Starting render');
    try { await render.start(project.id); } catch (err) { setError(err.response?.data?.error || err.message); }
    setBusy('');
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Create Project</h1>
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <section className="panel p-4">
          <label className="label">1. Topic</label>
          <div className="mt-2 flex gap-2">
            <input className="input" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Topik berita hari ini" />
            <button className="btn" onClick={generate} disabled={!topic || !!busy}>Generate</button>
          </div>
        </section>
        <section className="panel space-y-3 p-4">
          <p className="label">2-3. Edit AI package</p>
          <input className="input" value={pkg.thumbnail_title} onChange={(event) => setPkg({ ...pkg, thumbnail_title: event.target.value })} placeholder="Thumbnail title" />
          <label className="block">
            <span className="label">Optional thumbnail image for this content</span>
            <input className="input mt-1" type="file" accept="image/*" onChange={(event) => uploadThumbnail(event.target.files?.[0])} />
          </label>
          {(thumbnailPreview || project?.thumbnail_image) && <img className="h-28 w-20 rounded-md object-cover" src={thumbnailPreview || mediaUrl(project.thumbnail_image)} alt="Thumbnail preview" />}
          <textarea className="input min-h-36" value={pkg.narration} onChange={(event) => setPkg({ ...pkg, narration: event.target.value })} placeholder="Narration" />
          <textarea className="input" value={pkg.post_caption} onChange={(event) => setPkg({ ...pkg, post_caption: event.target.value })} placeholder="Post caption" />
          <input className="input" value={pkg.hashtags.join(', ')} onChange={(event) => setPkg({ ...pkg, hashtags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} placeholder="hashtags" />
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          <div className="panel p-4"><p className="label mb-2">4. Brand</p><BrandSelector value={brandId} onChange={setBrandId} /></div>
          <div className="panel p-4"><p className="label mb-2">5. Voice style</p><VoiceStylePicker value={voiceStyle} onChange={setVoiceStyle} /></div>
        </section>
        <section className="panel p-4">
          <div className="mb-3 flex items-center justify-between"><p className="label">6-7. Assets and trim</p><button className="btn-secondary" onClick={generateVoice} disabled={!pkg.narration || !!busy}>Save + voice</button></div>
          {project ? <><AssetUploader projectId={project.id} onDone={refresh} /><div className="mt-4"><AssetTrimEditor items={project.assets} onChange={refresh} /></div></> : <p className="text-sm text-slate-500">Generate voice first to create project.</p>}
        </section>
        {project && <TimelinePreview project={project} />}
      </div>
      <aside className="space-y-4">
        <div className="panel p-4">
          <p className="label">Status</p>
          <p className="mt-2 text-sm text-slate-600">{busy || project?.status || 'draft'}</p>
          <button className="btn mt-4 w-full" onClick={startRender} disabled={!project?.voice_path || !project?.assets?.length || !!busy}>Render video</button>
          {project?.output_path && <button className="btn-secondary mt-2 w-full" onClick={() => nav(`/projects/${project.id}`)}>Download output</button>}
        </div>
        {project && <RenderStatus projectId={project.id} />}
      </aside>
    </div>
  );
}
