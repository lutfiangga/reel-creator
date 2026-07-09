import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { brands, mediaUrl } from '../lib/api';
import CaptionStylePicker from '../components/CaptionStylePicker';

const animations = ['none', 'fade-in', 'fade-out', 'zoom-in', 'zoom-out', 'slide-up', 'slide-down', 'slide-left', 'slide-right'];
const defaults = {
  name: '', logo_top: '', overlay_path: '', logo_end: '', caption_style: 'bold', font_family: 'Plus Jakarta Sans', font_path: '',
  caption_text_color: '#ffffff', caption_bg_color: '#000000', caption_outline_color: '#000000', caption_outline_width: 0, caption_outline_mode: 'center', caption_font_size: 46, caption_font_weight: '700', caption_font_style: 'normal', caption_text_case: 'none', caption_letter_spacing: 0, caption_active_padding: 8, caption_active_radius: 6, caption_position: '50,78',
  primary_color: '#0d74ff', logo_position: '16,9', logo_top_scale: 1, logo_end_scale: 1,
  thumbnail_font_family: 'Bungee', thumbnail_bg_color: '#001dff', thumbnail_text_color: '#ffffff', thumbnail_font_size: 46, thumbnail_font_weight: '700', thumbnail_font_style: 'normal', thumbnail_text_case: 'none',
  thumbnail_outline_color: '#000000', thumbnail_outline_width: 0, thumbnail_letter_spacing: 0, thumbnail_position: '50,28',
  logo_top_in_animation: 'none', logo_top_in_duration: 0.6, logo_top_out_animation: 'none', logo_top_out_duration: 0.6,
  logo_end_in_animation: 'none', logo_end_in_duration: 0.6, logo_end_out_animation: 'none', logo_end_out_duration: 0.6,
};
const fontChoices = ['Plus Jakarta Sans', 'Bungee'];
const fontWeights = [['100', 'Thin'], ['200', 'Extra light'], ['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semi bold'], ['700', 'Bold'], ['800', 'Extra bold'], ['900', 'Black']];
const isHex = (value) => /^#[0-9a-f]{6}$/i.test(value || '');

function position(value) {
  const presets = { 'top-right': [92, 6], 'top-left': [8, 6], 'bottom-right': [92, 86], 'bottom-left': [8, 86], center: [50, 50] };
  if (presets[value]) return presets[value];
  const parts = String(value || '').split(',').map(Number);
  return Number.isFinite(parts[0]) && Number.isFinite(parts[1]) ? parts : presets['top-right'];
}

export default function BrandForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const previewRef = useRef(null);
  const previewUrlsRef = useRef({});
  const [form, setForm] = useState(defaults);
  const [previewUrls, setPreviewUrls] = useState({});
  const [dragging, setDragging] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [previewTime, setPreviewTime] = useState(0);
  const [error, setError] = useState('');
  const [x, y] = position(form.logo_position);
  const previewFont = form.font_path ? 'BrandUploaded' : form.font_family;
  const hasOverlay = previewUrls.overlay_path || form.overlay_path;
  const previewDuration = 4;
  const closingStart = 3;
  const isClosing = (previewUrls.logo_end || form.logo_end) && previewTime >= closingStart;
  const [tx, ty] = position(form.thumbnail_position);
  const [cx, cy] = position(form.caption_position);
  const sampleCaptions = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'];
  const activeCaptionIndex = Math.floor((previewTime / previewDuration) * sampleCaptions.length) % sampleCaptions.length;
  const applyCase = (text, mode = form.caption_text_case) => mode === 'uppercase' ? text.toUpperCase() : mode === 'lowercase' ? text.toLowerCase() : mode === 'capitalize' ? text.replace(/\b\w/g, (char) => char.toUpperCase()) : text;
  const outlineStyle = () => {
    const width = Number(form.caption_outline_width || 0) / 3;
    const color = isHex(form.caption_outline_color) ? form.caption_outline_color : '#000000';
    if (!width) return {};
    if (form.caption_outline_mode === 'outer') return { textShadow: `${-width}px 0 ${color}, ${width}px 0 ${color}, 0 ${-width}px ${color}, 0 ${width}px ${color}` };
    if (form.caption_outline_mode === 'inner') return { WebkitTextStroke: `${width}px ${color}`, paintOrder: 'fill' };
    return { WebkitTextStroke: `${width}px ${color}` };
  };

  useEffect(() => {
    if (!id) return;
    brands.list().then((items) => setForm({ ...defaults, ...(items.find((brand) => String(brand.id) === id) || {}) }));
  }, [id]);

  useEffect(() => () => {
    Object.values(previewUrlsRef.current).forEach(URL.revokeObjectURL);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => setPreviewTime((time) => (time + 0.05) % previewDuration), 50);
    return () => clearInterval(timer);
  }, [playing]);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function upload(file, key) {
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreviewUrls((current) => {
      if (current[key]) URL.revokeObjectURL(current[key]);
      previewUrlsRef.current = { ...current, [key]: localUrl };
      return previewUrlsRef.current;
    });
    const body = new FormData();
    body.append('file', file);
    try {
      const result = await brands.upload(body);
      setField(key, result.path);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  function src(key) {
    return previewUrls[key] || mediaUrl(form[key]);
  }

  function effect(name, progress, out = false) {
    const p = Math.max(0, Math.min(1, progress));
    const from = out ? p : 1 - p;
    if (name === 'fade-in' || name === 'fade-out') return { opacity: out ? 1 - p : p, move: '', scale: 1 };
    if (name === 'zoom-in') return { opacity: 1, move: '', scale: out ? 1 + 0.18 * p : 0.82 + 0.18 * p };
    if (name === 'zoom-out') return { opacity: 1, move: '', scale: out ? 1 - 0.18 * p : 1.18 - 0.18 * p };
    if (name === 'slide-up') return { opacity: 1, move: `translate(0, ${out ? -100 * p : 100 * from}vh)`, scale: 1 };
    if (name === 'slide-down') return { opacity: 1, move: `translate(0, ${out ? 100 * p : -100 * from}vh)`, scale: 1 };
    if (name === 'slide-left') return { opacity: 1, move: `translate(${out ? -100 * p : 100 * from}vw, 0)`, scale: 1 };
    if (name === 'slide-right') return { opacity: 1, move: `translate(${out ? 100 * p : -100 * from}vw, 0)`, scale: 1 };
    return { opacity: 1, move: '', scale: 1 };
  }

  function layerMotion(prefix, baseScale = 1, time = previewTime, duration = previewDuration) {
    const inName = form[`${prefix}_in_animation`] || 'none';
    const outName = form[`${prefix}_out_animation`] || 'none';
    const inDuration = Number(form[`${prefix}_in_duration`] || 0.6);
    const outDuration = Number(form[`${prefix}_out_duration`] || 0.6);
    let fx = { opacity: 1, move: '', scale: 1 };
    if (inName !== 'none' && time < inDuration) fx = effect(inName, time / inDuration);
    if (outName !== 'none' && time > duration - outDuration) fx = effect(outName, (time - (duration - outDuration)) / outDuration, true);
    return { opacity: fx.opacity, transform: `${fx.move} scale(${baseScale * fx.scale})` };
  }

  function animationFields(prefix, label) {
    return (
      <>
        <label><span className="label">{label} in</span><select className="input mt-1" value={form[`${prefix}_in_animation`] || 'none'} onChange={(event) => setField(`${prefix}_in_animation`, event.target.value)}>{animations.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span className="label">{label} in duration</span><input className="input mt-1" type="number" min="0.1" max="10" step="0.1" value={form[`${prefix}_in_duration`] || 0.6} onChange={(event) => setField(`${prefix}_in_duration`, event.target.value)} /></label>
        <label><span className="label">{label} out</span><select className="input mt-1" value={form[`${prefix}_out_animation`] || 'none'} onChange={(event) => setField(`${prefix}_out_animation`, event.target.value)}>{animations.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span className="label">{label} out duration</span><input className="input mt-1" type="number" min="0.1" max="10" step="0.1" value={form[`${prefix}_out_duration`] || 0.6} onChange={(event) => setField(`${prefix}_out_duration`, event.target.value)} /></label>
      </>
    );
  }

  function uploadField(key, label, accept) {
    return (
      <label>
        <span className="label">{label}</span>
        <input className="input mt-1" type="file" accept={accept} onChange={(event) => upload(event.target.files?.[0], key)} />
        {form[key] && <p className="mt-1 truncate text-xs text-slate-500">{form[key]}</p>}
      </label>
    );
  }

  function group(title, children) {
    return <section className="rounded-md border border-slate-200 p-4"><h2 className="mb-3 text-sm font-semibold">{title}</h2><div className="grid gap-4 md:grid-cols-2">{children}</div></section>;
  }

  function placeLogo(event) {
    if (!previewRef.current) return;
    const box = previewRef.current.getBoundingClientRect();
    const nextX = Math.max(0, Math.min(100, ((event.clientX - box.left) / box.width) * 100));
    const nextY = Math.max(0, Math.min(100, ((event.clientY - box.top) / box.height) * 100));
    setField('logo_position', `${nextX.toFixed(1)},${nextY.toFixed(1)}`);
  }

  function moveLogo(event) {
    if (dragging) placeLogo(event);
  }

  async function save(event) {
    event.preventDefault();
    if (!isHex(form.primary_color)) return setError('Primary color harus hex, contoh #ef4444');
    await brands.save(form, id);
    nav('/brands');
  }

  return (
    <form className="grid gap-5 xl:grid-cols-[1fr_360px]" onSubmit={save}>
      {(previewUrls.font_path || form.font_path) && <style>{`@font-face{font-family:BrandUploaded;src:url("${src('font_path')}")}`}</style>}
      <style>{`
        @keyframes fade-in{from{opacity:0}to{opacity:1}}
        @keyframes fade-out{from{opacity:1}to{opacity:0}}
        @keyframes zoom-in{from{scale:.82}to{scale:1}}
        @keyframes zoom-out{from{scale:1.18}to{scale:1}}
        @keyframes slide-up{from{translate:0 100vh}to{translate:0 0}}
        @keyframes slide-down{from{translate:0 -100vh}to{translate:0 0}}
        @keyframes slide-left{from{translate:100vw 0}to{translate:0 0}}
        @keyframes slide-right{from{translate:-100vw 0}to{translate:0 0}}
        @keyframes fade-in-out{from{opacity:1}to{opacity:0}}
        @keyframes fade-out-out{from{opacity:1}to{opacity:0}}
        @keyframes zoom-in-out{from{scale:1}to{scale:1.18}}
        @keyframes zoom-out-out{from{scale:1}to{scale:.82}}
        @keyframes slide-up-out{from{translate:0 0}to{translate:0 -100vh}}
        @keyframes slide-down-out{from{translate:0 0}to{translate:0 100vh}}
        @keyframes slide-left-out{from{translate:0 0}to{translate:-100vw 0}}
        @keyframes slide-right-out{from{translate:0 0}to{translate:100vw 0}}
        @keyframes sample-video{from{background-position:0% 0%}to{background-position:100% 100%}}
      `}</style>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{id ? 'Edit Brand' : 'New Brand'}</h1>
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="panel space-y-4 p-4">
          {group('Brand', <>
            <label><span className="label">name</span><input className="input mt-1" value={form.name} onChange={(event) => setField('name', event.target.value)} /></label>
          </>)}
          {group('Overlay / layout', <>
            {uploadField('overlay_path', 'Overlay/layout image', 'image/*')}
          </>)}
          {group('Thumbnail first frame', <>
            <label>
              <span className="label">thumbnail font</span>
              <input className="input mt-1" list="font-families" value={form.thumbnail_font_family || ''} onChange={(event) => setField('thumbnail_font_family', event.target.value)} placeholder="Search font" />
            </label>
            <label>
              <span className="label">background color</span>
              <div className="mt-1 flex gap-2">
                <input className="h-10 w-14 rounded-md border border-slate-300" type="color" value={isHex(form.thumbnail_bg_color) ? form.thumbnail_bg_color : '#001dff'} onChange={(event) => setField('thumbnail_bg_color', event.target.value)} />
                <input className="input" value={form.thumbnail_bg_color || ''} onChange={(event) => setField('thumbnail_bg_color', event.target.value)} />
              </div>
            </label>
            <label>
              <span className="label">text color</span>
              <div className="mt-1 flex gap-2">
                <input className="h-10 w-14 rounded-md border border-slate-300" type="color" value={isHex(form.thumbnail_text_color) ? form.thumbnail_text_color : '#ffffff'} onChange={(event) => setField('thumbnail_text_color', event.target.value)} />
                <input className="input" value={form.thumbnail_text_color || ''} onChange={(event) => setField('thumbnail_text_color', event.target.value)} />
              </div>
            </label>
            <label><span className="label">font size</span><input className="input mt-1" type="number" min="12" max="120" value={form.thumbnail_font_size || 46} onChange={(event) => setField('thumbnail_font_size', event.target.value)} /></label>
            <label><span className="label">thumbnail weight</span><select className="input mt-1" value={form.thumbnail_font_weight || '700'} onChange={(event) => setField('thumbnail_font_weight', event.target.value)}>{fontWeights.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span className="label">thumbnail style</span><select className="input mt-1" value={form.thumbnail_font_style || 'normal'} onChange={(event) => setField('thumbnail_font_style', event.target.value)}>{['normal', 'italic'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label><span className="label">thumbnail text case</span><select className="input mt-1" value={form.thumbnail_text_case || 'none'} onChange={(event) => setField('thumbnail_text_case', event.target.value)}>{['none', 'uppercase', 'lowercase', 'capitalize'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label>
              <span className="label">outline color</span>
              <div className="mt-1 flex gap-2">
                <input className="h-10 w-14 rounded-md border border-slate-300" type="color" value={isHex(form.thumbnail_outline_color) ? form.thumbnail_outline_color : '#000000'} onChange={(event) => setField('thumbnail_outline_color', event.target.value)} />
                <input className="input" value={form.thumbnail_outline_color || ''} onChange={(event) => setField('thumbnail_outline_color', event.target.value)} />
              </div>
            </label>
            <label><span className="label">outline width</span><input className="input mt-1" type="number" min="0" max="20" step="0.1" value={form.thumbnail_outline_width || 0} onChange={(event) => setField('thumbnail_outline_width', event.target.value)} /></label>
            <label><span className="label">letter spacing</span><input className="input mt-1" type="number" min="-10" max="30" value={form.thumbnail_letter_spacing || 0} onChange={(event) => setField('thumbnail_letter_spacing', event.target.value)} /></label>
            <label><span className="label">position</span><input className="input mt-1" value={form.thumbnail_position || ''} onChange={(event) => setField('thumbnail_position', event.target.value)} /></label>
            <button className="btn-secondary" type="button" onClick={() => { setPlaying(false); setPreviewTime(0); }}>Preview thumbnail frame</button>
          </>)}
          {group('Logo top', <>
            {uploadField('logo_top', 'Logo top image', 'image/*')}
            <label><span className="label">position</span><input className="input mt-1" value={form.logo_position || ''} onChange={(event) => setField('logo_position', event.target.value)} /></label>
            <label><span className="label">scale</span><input className="input mt-1" type="number" min="0.1" max="5" step="0.1" value={form.logo_top_scale || 1} onChange={(event) => setField('logo_top_scale', event.target.value)} /></label>
            {animationFields('logo_top', 'logo top')}
          </>)}
          {group('Logo end / center', <>
            {uploadField('logo_end', 'Logo ending image', 'image/*')}
            <label><span className="label">scale</span><input className="input mt-1" type="number" min="0.1" max="5" step="0.1" value={form.logo_end_scale || 1} onChange={(event) => setField('logo_end_scale', event.target.value)} /></label>
            {animationFields('logo_end', 'logo end')}
          </>)}
          {group('Caption / font', <>
            <label>
              <span className="label">font_family</span>
              <input className="input mt-1" list="font-families" value={form.font_family || ''} onChange={(event) => setField('font_family', event.target.value)} placeholder="Search font" />
              <datalist id="font-families">{fontChoices.map((font) => <option key={font} value={font} />)}</datalist>
            </label>
            {uploadField('font_path', 'Upload font', '.ttf,.otf,.woff,.woff2')}
            <label>
              <span className="label">caption text color</span>
              <div className="mt-1 flex gap-2">
                <input className="h-10 w-14 rounded-md border border-slate-300" type="color" value={isHex(form.caption_text_color) ? form.caption_text_color : '#ffffff'} onChange={(event) => setField('caption_text_color', event.target.value)} />
                <input className="input" value={form.caption_text_color || ''} onChange={(event) => setField('caption_text_color', event.target.value)} />
              </div>
            </label>
            <label>
              <span className="label">caption bg color</span>
              <div className="mt-1 flex gap-2">
                <input className="h-10 w-14 rounded-md border border-slate-300" type="color" value={isHex(form.caption_bg_color) ? form.caption_bg_color : '#000000'} onChange={(event) => setField('caption_bg_color', event.target.value)} />
                <input className="input" value={form.caption_bg_color || ''} onChange={(event) => setField('caption_bg_color', event.target.value)} />
              </div>
            </label>
            <label>
              <span className="label">caption outline color</span>
              <div className="mt-1 flex gap-2">
                <input className="h-10 w-14 rounded-md border border-slate-300" type="color" value={isHex(form.caption_outline_color) ? form.caption_outline_color : '#000000'} onChange={(event) => setField('caption_outline_color', event.target.value)} />
                <input className="input" value={form.caption_outline_color || ''} onChange={(event) => setField('caption_outline_color', event.target.value)} />
              </div>
            </label>
            <label><span className="label">caption outline width</span><input className="input mt-1" type="number" min="0" max="20" step="0.1" value={form.caption_outline_width || 0} onChange={(event) => setField('caption_outline_width', event.target.value)} /></label>
            <label><span className="label">caption outline mode</span><select className="input mt-1" value={form.caption_outline_mode || 'center'} onChange={(event) => setField('caption_outline_mode', event.target.value)}>{['inner', 'outer', 'center'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label><span className="label">caption font size</span><input className="input mt-1" type="number" min="12" max="120" value={form.caption_font_size || 46} onChange={(event) => setField('caption_font_size', event.target.value)} /></label>
            <label><span className="label">caption weight</span><select className="input mt-1" value={form.caption_font_weight || '700'} onChange={(event) => setField('caption_font_weight', event.target.value)}>{fontWeights.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span className="label">caption style</span><select className="input mt-1" value={form.caption_font_style || 'normal'} onChange={(event) => setField('caption_font_style', event.target.value)}>{['normal', 'italic'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label><span className="label">caption text case</span><select className="input mt-1" value={form.caption_text_case || 'none'} onChange={(event) => setField('caption_text_case', event.target.value)}>{['none', 'uppercase', 'lowercase', 'capitalize'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label><span className="label">caption letter spacing</span><input className="input mt-1" type="number" min="-10" max="30" step="0.1" value={form.caption_letter_spacing || 0} onChange={(event) => setField('caption_letter_spacing', event.target.value)} /></label>
            <label><span className="label">active padding</span><input className="input mt-1" type="number" min="0" max="40" value={form.caption_active_padding || 8} onChange={(event) => setField('caption_active_padding', event.target.value)} /></label>
            <label><span className="label">active radius</span><input className="input mt-1" type="number" min="0" max="40" value={form.caption_active_radius || 6} onChange={(event) => setField('caption_active_radius', event.target.value)} /></label>
            <label><span className="label">caption position</span><input className="input mt-1" value={form.caption_position || ''} onChange={(event) => setField('caption_position', event.target.value)} /></label>
            <div><span className="label">caption_style</span><div className="mt-1"><CaptionStylePicker value={form.caption_style} onChange={(caption_style) => setField('caption_style', caption_style)} /></div></div>
          </>)}
        </div>
        <button className="btn">Save brand</button>
      </div>

      <aside className="space-y-3">
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Live preview</p>
            <p className="text-xs text-slate-500">{Number(x).toFixed(1)}%, {Number(y).toFixed(1)}%</p>
          </div>
          <div
            ref={previewRef}
            className="relative mx-auto aspect-[9/16] max-h-[620px] overflow-hidden rounded-lg bg-slate-950"
            onPointerDown={(event) => { setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); placeLogo(event); }}
            onPointerMove={moveLogo}
            onPointerUp={() => setDragging(false)}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a,#1e293b_30%,#475569_50%,#111827_70%,#020617)] bg-[length:180%_180%]" style={{ animation: 'sample-video 8s linear infinite alternate', animationPlayState: playing ? 'running' : 'paused', animationDelay: `${-previewTime}s` }} />
            {!hasOverlay && <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,transparent,rgba(0,0,0,.55))]" />}
            {!hasOverlay && <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_58%,rgba(13,116,255,.92))]" />}
            {!hasOverlay && <div className="absolute bottom-0 left-0 right-0 h-48 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.18)_0_1px,transparent_1px_34px)] opacity-40" />}
            {hasOverlay && <img className="absolute inset-0 h-full w-full object-cover" src={src('overlay_path')} alt="" />}
            {previewTime < 0.08 && (
                <div
                  className="absolute w-[90%] px-3 py-2 text-center font-black leading-tight"
                  style={{
                    left: `${tx}%`,
                    top: `${ty}%`,
                    transform: 'translateX(-50%)',
                    background: isHex(form.thumbnail_bg_color) ? form.thumbnail_bg_color : '#001dff',
                    color: isHex(form.thumbnail_text_color) ? form.thumbnail_text_color : '#ffffff',
                    fontFamily: form.thumbnail_font_family || 'Bungee',
                    fontSize: `${Number(form.thumbnail_font_size || 46) / 3}px`,
                    fontWeight: form.thumbnail_font_weight || '700',
                    fontStyle: form.thumbnail_font_style || 'normal',
                    letterSpacing: `${Number(form.thumbnail_letter_spacing || 0) / 3}px`,
                    WebkitTextStroke: `${Number(form.thumbnail_outline_width || 0) / 3}px ${isHex(form.thumbnail_outline_color) ? form.thumbnail_outline_color : '#000000'}`,
                  }}
                > 
                  {applyCase('Lorem ipsum dolor sit amet, consectetur adipiscing elit.', form.thumbnail_text_case)}
                </div>
            )}
            {isClosing && (
              <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2">
                <img
                  className="max-h-32 max-w-56 object-contain"
                  style={layerMotion('logo_end', Number(form.logo_end_scale || 1), previewTime - closingStart, previewDuration - closingStart)}
                  src={src('logo_end')}
                  alt="Logo ending"
                  draggable={false}
                />
              </div>
            )}
            {!isClosing && (
              <div
                className="absolute w-[90%] px-4 py-2 text-center font-black leading-tight"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  transform: 'translateX(-50%)',
                  color: isHex(form.caption_text_color) ? form.caption_text_color : '#ffffff',
                  background: 'transparent',
                  fontFamily: previewFont,
                  fontSize: `${Number(form.caption_font_size || 46) / 3}px`,
                  fontWeight: form.caption_font_weight || '700',
                  fontStyle: form.caption_font_style || 'normal',
                  letterSpacing: `${Number(form.caption_letter_spacing || 0) / 3}px`,
                  ...outlineStyle(),
                }}
              >
                {sampleCaptions.map((word, index) => (
                  <span
                    key={word}
                    className="mx-0.5 inline-block"
                    style={index === activeCaptionIndex ? {
                      background: isHex(form.caption_bg_color) ? form.caption_bg_color : '#000000',
                      padding: `${Number(form.caption_active_padding || 8) / 3}px`,
                      borderRadius: `${Number(form.caption_active_radius || 6) / 3}px`,
                    } : { background: 'transparent', padding: `${Number(form.caption_active_padding || 8) / 3}px` }}
                  >{applyCase(word)}</span>
                ))}
              </div>
            )}
            {!isClosing && (previewUrls.logo_top || form.logo_top) && (
              <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
                <img
                  className="max-h-16 max-w-28 cursor-grab object-contain active:cursor-grabbing"
                  style={layerMotion('logo_top', Number(form.logo_top_scale || 1))}
                  src={src('logo_top')}
                  alt="Logo top"
                  draggable={false}
                />
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button className="btn-secondary px-3 py-1" type="button" onClick={() => setPlaying((value) => !value)}>{playing ? 'Pause' : 'Play'}</button>
            <input className="w-full accent-slate-950" type="range" min="0" max={previewDuration} step="0.05" value={previewTime} onChange={(event) => { setPlaying(false); setPreviewTime(Number(event.target.value)); }} />
            <span className="w-12 text-right text-xs text-slate-500">{previewTime.toFixed(1)}s</span>
          </div>
        </div>
      </aside>
    </form>
  );
}
