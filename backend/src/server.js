import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '100kb' }));

const validStatuses = new Set(['Pending', 'In Progress', 'Completed']);
const validPriorities = new Set(['Low', 'Medium', 'High']);

function validateTask(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const status = body.status ?? 'Pending';
  const priority = body.priority ?? 'Medium';
  const due_date = body.due_date || null;

  if (!title) return { error: 'Task title is required.' };
  if (title.length > 120) return { error: 'Title must be 120 characters or fewer.' };
  if (description.length > 1000) return { error: 'Description must be 1000 characters or fewer.' };
  if (!validStatuses.has(status)) return { error: 'Choose a valid task status.' };
  if (!validPriorities.has(priority)) return { error: 'Choose a valid priority.' };
  if (due_date !== null && (typeof due_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(due_date))) {
    return { error: 'Due date must use YYYY-MM-DD format.' };
  }
  return { value: { title, description, status, priority, due_date } };
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'TaskFlow API' }));

app.get('/api/tasks', (req, res) => {
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const conditions = [];
  const params = [];
  if (search) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status && status !== 'All') {
    if (!validStatuses.has(status)) return res.status(400).json({ error: 'Invalid status filter.' });
    conditions.push('status = ?');
    params.push(status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const tasks = db.prepare(`SELECT * FROM tasks ${where} ORDER BY
    CASE status WHEN 'In Progress' THEN 1 WHEN 'Pending' THEN 2 ELSE 3 END,
    CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
    id DESC`).all(...params);
  res.json(tasks);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  res.json(task);
});

app.post('/api/tasks', (req, res) => {
  const result = validateTask(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });
  const { title, description, status, priority, due_date } = result.value;
  const info = db.prepare(`INSERT INTO tasks (title, description, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?)`).run(title, description, status, priority, due_date);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid task ID.' });
  const result = validateTask(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });
  const existing = db.prepare('SELECT id FROM tasks WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Task not found.' });
  const { title, description, status, priority, due_date } = result.value;
  db.prepare(`UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?,
    due_date = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(title, description, status, priority, due_date, id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid task ID.' });
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  if (!result.changes) return res.status(404).json({ error: 'Task not found.' });
  res.status(204).end();
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

app.listen(PORT, () => {
  console.log(`TaskFlow API running at http://localhost:${PORT}`);
});
