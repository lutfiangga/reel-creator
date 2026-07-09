import { useEffect, useState } from 'react';
import { brands } from '../lib/api';

export default function BrandSelector({ value, onChange }) {
  const [items, setItems] = useState([]);
  useEffect(() => { brands.list().then(setItems).catch(() => setItems([])); }, []);
  return (
    <select className="input" value={value || ''} onChange={(event) => onChange(event.target.value || null)}>
      <option value="">No brand</option>
      {items.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
    </select>
  );
}
