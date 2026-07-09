export default function VideoPreview({ path }) {
  if (!path) return <div className="grid aspect-[9/16] max-h-[520px] place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">No output yet</div>;
  const src = `http://localhost:3000/${path}`;
  return <video className="aspect-[9/16] max-h-[520px] rounded-lg bg-black" src={src} controls />;
}
