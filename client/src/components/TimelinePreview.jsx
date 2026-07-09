import { seconds } from '../lib/utils';

export default function TimelinePreview({ project }) {
  const assets = project?.assets || [];
  const total = assets.reduce((sum, asset) => sum + Number(asset.calculated_duration || 0), 0);
  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Timeline</h3>
        <p className="text-xs text-slate-500">Assets {seconds(total)} + closing 5.0s = {seconds(project?.total_duration)}</p>
      </div>
      <div className="flex h-12 overflow-hidden rounded-md border border-slate-200">
        {assets.map((asset) => (
          <div key={asset.id} className="grid place-items-center border-r border-white bg-slate-900 px-2 text-xs font-semibold text-white" style={{ flexGrow: Math.max(1, Number(asset.calculated_duration || 1)) }}>
            {asset.type} {seconds(asset.calculated_duration)}
          </div>
        ))}
        <div className="grid min-w-20 place-items-center bg-red-600 px-2 text-xs font-semibold text-white">closing 5s</div>
      </div>
    </div>
  );
}
