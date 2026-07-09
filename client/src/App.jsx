import { NavLink, Route, Routes } from 'react-router-dom';
import { Clapperboard, History, LayoutDashboard, Layers, PlusCircle } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ProjectCreate from './pages/ProjectCreate';
import ProjectDetail from './pages/ProjectDetail';
import BrandManager from './pages/BrandManager';
import BrandForm from './pages/BrandForm';
import AssetEditor from './pages/AssetEditor';
import RenderHistory from './pages/RenderHistory';

const nav = [
  ['/', LayoutDashboard, 'Dashboard'],
  ['/create', PlusCircle, 'Create'],
  ['/brands', Layers, 'Brands'],
  ['/history', History, 'History'],
];

function App() {
  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <div className="grid size-10 place-items-center rounded-md bg-red-600 text-white"><Clapperboard size={20} /></div>
          <div>
            <p className="text-sm font-semibold">News Reel Creator</p>
            <p className="text-xs text-slate-500">AI newsroom pipeline</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map(([to, Icon, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon size={17} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<ProjectCreate />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/brands" element={<BrandManager />} />
            <Route path="/brands/new" element={<BrandForm />} />
            <Route path="/brands/:id" element={<BrandForm />} />
            <Route path="/assets/:projectId" element={<AssetEditor />} />
            <Route path="/history" element={<RenderHistory />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
