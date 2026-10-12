import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'tasks.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Pending'
      CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    priority TEXT NOT NULL DEFAULT 'Medium'
      CHECK (priority IN ('Low', 'Medium', 'High')),
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const count = db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?)
  `);
  const examples = [
    ['Set up project structure', 'Create the frontend and backend folders.', 'Completed', 'High', '2026-10-13'],
    ['Build dashboard interface', 'Create a responsive overview of tasks.', 'In Progress', 'High', '2026-10-15'],
    ['Connect API to database', 'Implement and test CRUD endpoints.', 'Pending', 'Medium', '2026-10-17'],
    ['Write project documentation', 'Document setup steps and API endpoints.', 'Pending', 'Low', '2026-10-20']
  ];
  const transaction = db.transaction((rows) => rows.forEach((row) => insert.run(...row)));
  transaction(examples);
}

export default db;
