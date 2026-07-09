import { useState } from 'react';
import { assets } from '../lib/api';

export default function AssetUploader({ projectId, onDone }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const form = new FormData();
    form.append('project_id', projectId);
    form.append('file', file);
    await assets.upload(form).finally(() => setBusy(false));
    onDone();
  }

  async function addUrl() {
    if (!url.trim()) return;
    setBusy(true);
    await assets.url({ project_id: projectId, url }).finally(() => setBusy(false));
    setUrl('');
    onDone();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="panel flex cursor-pointer items-center justify-center px-4 py-8 text-sm font-semibold text-slate-600 hover:bg-slate-50">
        <input className="hidden" type="file" accept="video/*,image/*,audio/*" onChange={upload} disabled={busy} />
        Upload video, image, or audio
      </label>
      <div className="panel p-4">
        <label className="label">Public video URL</label>
        <div className="mt-2 flex gap-2">
          <input className="input" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." />
          <button className="btn" type="button" onClick={addUrl} disabled={busy}>Add</button>
        </div>
      </div>
    </div>
  );
}
