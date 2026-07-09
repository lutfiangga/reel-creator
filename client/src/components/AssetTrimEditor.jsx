import { assets } from '../lib/api';
import { seconds } from '../lib/utils';

export default function AssetTrimEditor({ items = [], onChange }) {
  async function patch(id, data) {
    await assets.update(id, data);
    onChange();
  }
  async function remove(id) {
    await assets.remove(id);
    onChange();
  }
  if (!items.length) return <p className="text-sm text-slate-500">No assets yet.</p>;
  return (
    <div className="space-y-2">
      {items.map((asset, index) => (
        <div key={asset.id} className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[1fr_110px_110px_110px_auto]">
          <div>
            <p className="text-sm font-semibold">{index + 1}. {asset.type} / {asset.source_type}</p>
            <p className="truncate text-xs text-slate-500">{asset.source_path || asset.url}</p>
          </div>
          <input className="input" type="number" step="0.1" defaultValue={asset.trim_start || 0} onBlur={(event) => patch(asset.id, { trim_start: event.target.value })} />
          <input className="input" type="number" step="0.1" defaultValue={asset.trim_end || ''} placeholder="trim end" onBlur={(event) => patch(asset.id, { trim_end: event.target.value })} />
          <input className="input" type="number" step="0.1" defaultValue={asset.custom_duration || ''} placeholder={seconds(asset.calculated_duration)} onBlur={(event) => patch(asset.id, { custom_duration: event.target.value })} />
          <button className="btn-secondary" type="button" onClick={() => remove(asset.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
