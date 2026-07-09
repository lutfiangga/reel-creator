import { useEffect, useState } from 'react';
import { render } from '../lib/api';

export default function RenderStatus({ projectId }) {
  const [job, setJob] = useState(null);
  useEffect(() => {
    if (!projectId) return undefined;
    const load = () => render.status(projectId).then(setJob).catch(() => {});
    load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [projectId]);
  const progress = job?.progress || 0;
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Render status</span>
        <span className="text-slate-500">{job?.status || 'idle'} {progress}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-red-600" style={{ width: `${progress}%` }} />
      </div>
      {job?.error_message && <p className="mt-2 text-sm text-red-600">{job.error_message}</p>}
    </div>
  );
}
