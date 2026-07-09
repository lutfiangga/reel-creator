import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { brands } from '../lib/api';

export default function BrandManager() {
  const [items, setItems] = useState([]);
  const load = () => brands.list().then(setItems);
  useEffect(() => { load(); }, []);
  async function remove(id) {
    await brands.remove(id);
    load();
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Brand Manager</h1>
        <Link className="btn" to="/brands/new">New brand</Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((brand) => (
          <div key={brand.id} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{brand.name}</p>
                <p className="text-sm text-slate-500">{brand.caption_style} / {brand.logo_position}</p>
              </div>
              <span className="size-6 rounded" style={{ background: brand.primary_color }} />
            </div>
            <div className="mt-4 flex gap-2"><Link className="btn-secondary" to={`/brands/${brand.id}`}>Edit</Link><button className="btn-secondary" onClick={() => remove(brand.id)}>Delete</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
