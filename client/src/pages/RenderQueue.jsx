import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { render } from '../lib/api';

const fmtDate = (val) => {
  if (!val) return '-';
  const d = new Date(val.replace(' ', 'T') + 'Z');
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('id-ID');
};

const fmtTime = (val) => {
  if (!val) return '';
  const d = new Date(val.replace(' ', 'T') + 'Z');
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('id-ID');
};

const statusColor = {
  running: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-slate-100 text-slate-600',
};

export default function RenderQueue() {
  const [jobs, setJobs] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const load = () => render.list().then(setJobs).catch(() => {});
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, []);

  const running = jobs.filter((j) => j.status === 'running').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Render Queue</h1>
          <p className="text-sm text-slate-500">
            {jobs.length} jobs total
            {running > 0 && <span className="ml-2 text-yellow-600 font-medium">· {running} running</span>}
          </p>
        </div>
        <button className="btn-secondary text-sm" onClick={() => render.list().then(setJobs)}>
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {jobs.length === 0 && (
          <div className="panel p-8 text-center text-sm text-slate-500">
            No render jobs yet.
          </div>
        )}

        {jobs.map((job) => {
          const isOpen = expanded === job.id;
          return (
            <div key={job.id} className="panel overflow-hidden">
              <button
                className="flex w-full items-center gap-4 p-4 text-left hover:bg-slate-50"
                onClick={() => setExpanded(isOpen ? null : job.id)}
              >
                <span className="w-8 text-sm font-semibold text-slate-500">#{job.id}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium truncate">{job.project_title || `Project #${job.project_id}`}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[job.status] || 'bg-slate-100'}`}>
                      {job.status}
                    </span>
                    <span className="text-sm text-slate-500">{job.progress || 0}%</span>
                  </div>
                  {job.status === 'running' && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-red-600 transition-all duration-500" style={{ width: `${job.progress || 0}%` }} />
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {fmtTime(job.started_at)}
                </div>
                <svg className={`size-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <span className="text-xs text-slate-500">Job ID</span>
                      <p className="font-mono">{job.id}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Project</span>
                      <p>
                        <Link to={`/projects/${job.project_id}`} className="text-blue-600 hover:underline">
                          {job.project_title || `Project #${job.project_id}`}
                        </Link>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Progress</span>
                      <p className="font-mono">{job.progress || 0}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Status</span>
                      <p><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[job.status] || 'bg-slate-100'}`}>{job.status}</span></p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Started</span>
                      <p className="font-mono text-xs">{fmtDate(job.started_at)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Finished</span>
                      <p className="font-mono text-xs">{fmtDate(job.finished_at)}</p>
                    </div>
                  </div>
                  {job.error_message && (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                      <p className="mb-1 text-xs font-semibold text-red-700">Error</p>
                      <pre className="whitespace-pre-wrap text-xs text-red-600">{job.error_message}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
