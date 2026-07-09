import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projects, render } from '../lib/api';
import AssetTrimEditor from '../components/AssetTrimEditor';
import RenderStatus from '../components/RenderStatus';
import TimelinePreview from '../components/TimelinePreview';
import VideoPreview from '../components/VideoPreview';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const load = () => projects.get(id).then(setProject);
  useEffect(() => { load(); }, [id]);
  if (!project) return <p className="text-sm text-slate-500">Loading...</p>;
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-sm text-slate-500">{project.topic}</p>
        </div>
        <div className="panel p-4">
          <p className="label mb-2">Narration</p>
          <p className="whitespace-pre-wrap text-sm leading-6">{project.narration}</p>
        </div>
        <AssetTrimEditor items={project.assets} onChange={load} />
        <TimelinePreview project={project} />
      </div>
      <aside className="space-y-4">
        <VideoPreview path={project.output_path} />
        <RenderStatus projectId={project.id} />
        <a className="btn w-full" href={render.downloadUrl(project.id)}>Download</a>
        <Link className="btn-secondary w-full" to={`/assets/${project.id}`}>Edit assets</Link>
      </aside>
    </div>
  );
}
