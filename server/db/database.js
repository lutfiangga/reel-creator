const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'news-reel.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
const brandCols = db.prepare('PRAGMA table_info(brands)').all().map((col) => col.name);
if (!brandCols.includes('font_path')) db.exec('ALTER TABLE brands ADD COLUMN font_path TEXT');
if (!brandCols.includes('caption_text_color')) db.exec("ALTER TABLE brands ADD COLUMN caption_text_color TEXT DEFAULT '#ffffff'");
if (!brandCols.includes('caption_bg_color')) db.exec("ALTER TABLE brands ADD COLUMN caption_bg_color TEXT DEFAULT '#000000'");
if (!brandCols.includes('caption_outline_color')) db.exec("ALTER TABLE brands ADD COLUMN caption_outline_color TEXT DEFAULT '#000000'");
if (!brandCols.includes('caption_outline_width')) db.exec('ALTER TABLE brands ADD COLUMN caption_outline_width REAL DEFAULT 0');
if (!brandCols.includes('caption_outline_mode')) db.exec("ALTER TABLE brands ADD COLUMN caption_outline_mode TEXT DEFAULT 'center'");
if (!brandCols.includes('caption_font_size')) db.exec('ALTER TABLE brands ADD COLUMN caption_font_size INTEGER DEFAULT 46');
if (!brandCols.includes('caption_font_weight')) db.exec("ALTER TABLE brands ADD COLUMN caption_font_weight TEXT DEFAULT '700'");
if (!brandCols.includes('caption_font_style')) db.exec("ALTER TABLE brands ADD COLUMN caption_font_style TEXT DEFAULT 'normal'");
if (!brandCols.includes('caption_text_case')) db.exec("ALTER TABLE brands ADD COLUMN caption_text_case TEXT DEFAULT 'none'");
if (!brandCols.includes('caption_letter_spacing')) db.exec('ALTER TABLE brands ADD COLUMN caption_letter_spacing REAL DEFAULT 0');
if (!brandCols.includes('caption_active_padding')) db.exec('ALTER TABLE brands ADD COLUMN caption_active_padding INTEGER DEFAULT 8');
if (!brandCols.includes('caption_active_radius')) db.exec('ALTER TABLE brands ADD COLUMN caption_active_radius INTEGER DEFAULT 6');
if (!brandCols.includes('caption_position')) db.exec("ALTER TABLE brands ADD COLUMN caption_position TEXT DEFAULT '50,78'");
if (!brandCols.includes('logo_top_scale')) db.exec('ALTER TABLE brands ADD COLUMN logo_top_scale REAL DEFAULT 1');
if (!brandCols.includes('logo_end_scale')) db.exec('ALTER TABLE brands ADD COLUMN logo_end_scale REAL DEFAULT 1');
for (const col of ['logo_top_in_animation', 'logo_top_out_animation', 'logo_end_in_animation', 'logo_end_out_animation']) {
  if (!brandCols.includes(col)) db.exec(`ALTER TABLE brands ADD COLUMN ${col} TEXT DEFAULT 'none'`);
}
for (const col of ['logo_top_in_duration', 'logo_top_out_duration', 'logo_end_in_duration', 'logo_end_out_duration']) {
  if (!brandCols.includes(col)) db.exec(`ALTER TABLE brands ADD COLUMN ${col} REAL DEFAULT 0.6`);
}
if (!brandCols.includes('thumbnail_image')) db.exec('ALTER TABLE brands ADD COLUMN thumbnail_image TEXT');
if (!brandCols.includes('thumbnail_font_family')) db.exec("ALTER TABLE brands ADD COLUMN thumbnail_font_family TEXT DEFAULT 'Bungee'");
if (!brandCols.includes('thumbnail_bg_color')) db.exec("ALTER TABLE brands ADD COLUMN thumbnail_bg_color TEXT DEFAULT '#001dff'");
if (!brandCols.includes('thumbnail_text_color')) db.exec("ALTER TABLE brands ADD COLUMN thumbnail_text_color TEXT DEFAULT '#ffffff'");
if (!brandCols.includes('thumbnail_font_size')) db.exec('ALTER TABLE brands ADD COLUMN thumbnail_font_size INTEGER DEFAULT 46');
if (!brandCols.includes('thumbnail_font_weight')) db.exec("ALTER TABLE brands ADD COLUMN thumbnail_font_weight TEXT DEFAULT '700'");
if (!brandCols.includes('thumbnail_font_style')) db.exec("ALTER TABLE brands ADD COLUMN thumbnail_font_style TEXT DEFAULT 'normal'");
if (!brandCols.includes('thumbnail_text_case')) db.exec("ALTER TABLE brands ADD COLUMN thumbnail_text_case TEXT DEFAULT 'none'");
if (!brandCols.includes('thumbnail_outline_color')) db.exec("ALTER TABLE brands ADD COLUMN thumbnail_outline_color TEXT DEFAULT '#000000'");
if (!brandCols.includes('thumbnail_outline_width')) db.exec('ALTER TABLE brands ADD COLUMN thumbnail_outline_width REAL DEFAULT 0');
if (!brandCols.includes('thumbnail_letter_spacing')) db.exec('ALTER TABLE brands ADD COLUMN thumbnail_letter_spacing INTEGER DEFAULT 0');
if (!brandCols.includes('thumbnail_position')) db.exec("ALTER TABLE brands ADD COLUMN thumbnail_position TEXT DEFAULT '50,28'");
db.prepare("UPDATE brands SET thumbnail_position = '50,28' WHERE thumbnail_position IS NULL OR thumbnail_position = '' OR thumbnail_position = '8,28'").run();
const projectCols = db.prepare('PRAGMA table_info(projects)').all().map((col) => col.name);
if (!projectCols.includes('thumbnail_image')) db.exec('ALTER TABLE projects ADD COLUMN thumbnail_image TEXT');

const now = () => new Date().toISOString();
const toJson = (value) => JSON.stringify(value || []);
const fromJson = (value) => {
  try { return JSON.parse(value || '[]'); } catch { return []; }
};

function insert(table, data) {
  const keys = Object.keys(data);
  const cols = keys.join(', ');
  const vals = keys.map((key) => `@${key}`).join(', ');
  return db.prepare(`INSERT INTO ${table} (${cols}) VALUES (${vals})`).run(data).lastInsertRowid;
}

function update(table, id, data) {
  const row = { ...data, id };
  if (table === 'brands' || table === 'projects') row.updated_at = now();
  const sets = Object.keys(row).filter((key) => key !== 'id').map((key) => `${key}=@${key}`).join(', ');
  return db.prepare(`UPDATE ${table} SET ${sets} WHERE id=@id`).run(row);
}

function projectRow(row) {
  return row ? { ...row, hashtags: fromJson(row.hashtags) } : null;
}

function getProject(id) {
  const project = projectRow(db.prepare('SELECT * FROM projects WHERE id = ?').get(id));
  if (!project) return null;
  project.brand = project.brand_id ? db.prepare('SELECT * FROM brands WHERE id = ?').get(project.brand_id) : null;
  project.assets = db.prepare('SELECT * FROM assets WHERE project_id = ? ORDER BY order_index, id').all(id);
  project.render_job = db.prepare('SELECT * FROM render_jobs WHERE project_id = ? ORDER BY id DESC LIMIT 1').get(id) || null;
  return project;
}

module.exports = {
  db,
  now,
  toJson,
  insert,
  update,
  brands: {
    all: () => db.prepare('SELECT * FROM brands ORDER BY created_at DESC').all(),
    get: (id) => db.prepare('SELECT * FROM brands WHERE id = ?').get(id),
    create: (data) => insert('brands', data),
    update: (id, data) => update('brands', id, data),
    delete: (id) => db.prepare('DELETE FROM brands WHERE id = ?').run(id),
  },
  projects: {
    all: () => db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all().map(projectRow),
    get: getProject,
    create: (data) => insert('projects', { ...data, hashtags: toJson(data.hashtags) }),
    update: (id, data) => update('projects', id, data.hashtags ? { ...data, hashtags: toJson(data.hashtags) } : data),
    delete: (id) => db.prepare('DELETE FROM projects WHERE id = ?').run(id),
  },
  assets: {
    byProject: (projectId) => db.prepare('SELECT * FROM assets WHERE project_id = ? ORDER BY order_index, id').all(projectId),
    create: (data) => insert('assets', data),
    update: (id, data) => update('assets', id, data),
    delete: (id) => db.prepare('DELETE FROM assets WHERE id = ?').run(id),
  },
  jobs: {
    create: (projectId) => insert('render_jobs', { project_id: projectId, status: 'pending', progress: 0 }),
    update: (id, data) => update('render_jobs', id, data),
    latest: (projectId) => db.prepare('SELECT * FROM render_jobs WHERE project_id = ? ORDER BY id DESC LIMIT 1').get(projectId),
  },
};

if (require.main === module) console.log(`SQLite ready: ${dbPath}`);
