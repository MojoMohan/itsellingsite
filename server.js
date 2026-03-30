import express from 'express';
import session from 'express-session';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

const DATA_PATH = path.join(__dirname, 'data', 'catalog.json');

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'pcgs-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

app.use(express.static(__dirname));
app.use('/images', express.static(path.join(__dirname, 'images')));

const readCatalog = async () => {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

const writeCatalog = async (items) => {
  await fs.writeFile(DATA_PATH, JSON.stringify(items, null, 2));
};

const requireAuth = (req, res, next) => {
  if (req.session?.user === ADMIN_USER) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.user = ADMIN_USER;
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/session', (req, res) => {
  res.json({ authenticated: req.session?.user === ADMIN_USER });
});

app.get('/api/items', async (_req, res) => {
  const items = await readCatalog();
  res.json(items);
});

app.post('/api/items', requireAuth, async (req, res) => {
  const { name, category, brand, condition, spec, image } = req.body || {};
  if (!name || !category || !brand || !condition || !spec || !image) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const items = await readCatalog();
  const nextId = items.length ? Math.max(...items.map((i) => Number(i.id) || 0)) + 1 : 1;
  const item = { id: nextId, name, category, brand, condition, spec, image };
  items.push(item);
  await writeCatalog(items);
  res.json(item);
});

app.delete('/api/items/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const items = await readCatalog();
  const next = items.filter((i) => Number(i.id) !== id);
  await writeCatalog(next);
  res.json({ ok: true });
});

app.put('/api/items/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { name, category, brand, condition, spec, image } = req.body || {};
  if (!name || !category || !brand || !condition || !spec || !image) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const items = await readCatalog();
  const index = items.findIndex((item) => Number(item.id) === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  items[index] = { id, name, category, brand, condition, spec, image };
  await writeCatalog(items);
  res.json(items[index]);
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
