import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../lib/api';

export default function RenderHistory() {
  const [items, setItems] = useState([]);
  useEffect(() => { projects.list().then(setItems); }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Render History</h1>
      <div className="panel divide-y divide-slate-200">
        {items.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`} className="grid gap-2 p-4 hover:bg-slate-50 md:grid-cols-[1fr_120px_160px]">
            <span className="font-medium">{project.title}</span>
            <span className="text-sm text-slate-500">{project.status}</span>
            <span className="text-sm text-slate-500">{project.output_path || 'No output'}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
