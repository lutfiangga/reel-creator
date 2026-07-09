import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projects } from '../lib/api';
import AssetTrimEditor from '../components/AssetTrimEditor';
import AssetUploader from '../components/AssetUploader';
import TimelinePreview from '../components/TimelinePreview';

export default function AssetEditor() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const load = () => projects.get(projectId).then(setProject);
  useEffect(() => { load(); }, [projectId]);
  if (!project) return <p className="text-sm text-slate-500">Loading...</p>;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Asset Editor</h1>
      <AssetUploader projectId={project.id} onDone={load} />
      <AssetTrimEditor items={project.assets} onChange={load} />
      <TimelinePreview project={project} />
    </div>
  );
}
