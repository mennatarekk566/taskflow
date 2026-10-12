# TaskFlow — Interactive Dynamic Task Dashboard

A full-stack task management dashboard built for Task 3.

## Technology stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite (persistent local database file)
- Frontend/API communication: `fetch()` with `async/await`
- CRUD: Create, Read, Update, Delete

## Requirements
- Node.js 18+ (20+ recommended)
- npm

## Run locally

Open **two terminals** in the project folder.

### 1. Start the backend API
```bash
cd backend
npm install
npm run dev
```
The API runs at `http://localhost:5000`. The SQLite database file is created automatically at `backend/data/tasks.db`.

### 2. Start the React frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite, usually `http://localhost:5173`.

## API endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List tasks; optional `?search=` and `?status=` filters |
| GET | `/api/tasks/:id` | Get one task |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/health` | Health check |

## Notes
- The API validates input and uses parameterized SQL queries.
- CORS is restricted to the local Vite development origin by default. Update `CORS_ORIGIN` if your frontend runs elsewhere.
- SQLite is a real persistent local database, not an in-memory mock.
- GitHub Pages can host only the built frontend; it cannot run this Express API or SQLite database. For a live full-stack deployment, deploy the frontend and backend/database separately.
