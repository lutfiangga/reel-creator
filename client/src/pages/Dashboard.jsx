import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../lib/api';

export default function Dashboard() {
  const [items, setItems] = useState([]);
  useEffect(() => { projects.list().then(setItems).catch(() => setItems([])); }, []);
  const done = items.filter((item) => item.status === 'completed').length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Dashboard</h1>
          <p className="text-sm text-slate-500">Create AI news reels from topic, brand, voice, and assets.</p>
        </div>
        <Link className="btn" to="/create">New reel</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[[items.length, 'Projects'], [done, 'Completed'], [items.length - done, 'Active drafts']].map(([value, label]) => (
          <div key={label} className="panel p-5"><p className="text-3xl font-bold">{value}</p><p className="text-sm text-slate-500">{label}</p></div>
        ))}
      </div>
      <div className="panel overflow-hidden">
        <div className="border-b border-slate-200 p-4 text-sm font-semibold">Recent projects</div>
        <div className="divide-y divide-slate-200">
          {items.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="grid gap-2 p-4 hover:bg-slate-50 md:grid-cols-[1fr_140px_120px]">
              <span className="font-medium">{project.title}</span>
              <span className="text-sm text-slate-500">{project.status}</span>
              <span className="text-sm text-slate-500">{Number(project.total_duration || 0).toFixed(1)}s</span>
            </Link>
          ))}
          {!items.length && <p className="p-4 text-sm text-slate-500">No projects yet.</p>}
        </div>
      </div>
    </div>
  );
}
