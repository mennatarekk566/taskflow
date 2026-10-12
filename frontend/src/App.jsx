import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownUp, CalendarDays, Check, CheckCircle2, ChevronDown,
  Circle, Clock3, ClipboardList, LayoutDashboard, ListTodo, LoaderCircle,
  Menu, MoreHorizontal, Plus, Search, Sparkles, Target, Trash2, X, Pencil,
  AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STATUSES = ['Pending', 'In Progress', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const emptyForm = { title: '', description: '', status: 'Pending', priority: 'Medium', due_date: '' };

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

function dateLabel(value) {
  if (!value) return 'No due date';
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (filter !== 'All') params.set('status', filter);
      const data = await api(`/tasks?${params.toString()}`);
      setTasks(data);
    } catch (err) {
      setError(`${err.message}. Make sure the backend is running on port 5000.`);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const allStats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    pending: tasks.filter(t => t.status === 'Pending').length,
    high: tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length
  }), [tasks]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(task) {
    setEditing(task);
    setForm({
      title: task.title, description: task.description || '', status: task.status,
      priority: task.priority, due_date: task.due_date || ''
    });
    setModalOpen(true);
  }

  async function submitTask(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api(`/tasks/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
        setNotice('Task updated successfully.');
      } else {
        await api('/tasks', { method: 'POST', body: JSON.stringify(form) });
        setNotice('Task created successfully.');
      }
      setModalOpen(false);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await api(`/tasks/${task.id}`, { method: 'DELETE' });
      setNotice('Task deleted.');
      await loadTasks();
    } catch (err) { setError(err.message); }
  }

  async function cycleStatus(task) {
    const next = STATUSES[(STATUSES.indexOf(task.status) + 1) % STATUSES.length];
    try {
      await api(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: task.title, description: task.description, status: next, priority: task.priority, due_date: task.due_date })
      });
      setNotice(`Moved to ${next}.`);
      await loadTasks();
    } catch (err) { setError(err.message); }
  }

  const completion = allStats.total ? Math.round((allStats.completed / allStats.total) * 100) : 0;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><ListTodo size={22} /></div><span>task<span className="brand-accent">flow</span></span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          <button className="nav-item active"><LayoutDashboard size={18} /> Overview <span className="nav-pill">01</span></button>
          <button className="nav-item" onClick={() => { setFilter('All'); setMobileNav(false); }}><ClipboardList size={18} /> All tasks</button>
          <button className="nav-item" onClick={() => { setFilter('In Progress'); setMobileNav(false); }}><Activity size={18} /> In progress</button>
          <button className="nav-item" onClick={() => { setFilter('Completed'); setMobileNav(false); }}><CheckCircle2 size={18} /> Completed</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="tip-card"><div className="tip-icon"><Sparkles size={17} /></div><strong>Stay in your flow</strong><p>Small steps every day add up to big progress.</p><div className="tip-progress"><span /></div><small>Keep going — you’ve got this!</small></div>
          <div className="profile-row"><div className="avatar">M</div><div className="profile-copy"><strong>My Workspace</strong><span>Personal account</span></div><MoreHorizontal size={19} className="muted-icon" /></div>
        </div>
      </aside>

      {mobileNav && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)} />}
      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={21} /></button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div>
          <div className="topbar-right"><span className="today-label"><span className="online-dot" /> Your productivity space</span><div className="avatar avatar-small">M</div></div>
        </header>

        <section className="page-content">
          <div className="welcome-row">
            <div><div className="eyebrow"><Sparkles size={14} /> YOUR PERSONAL WORKSPACE</div><h1>Good things take <span>tasks.</span></h1><p className="subtitle">A little progress each day adds up to big results.</p></div>
            <button className="primary-button" onClick={openCreate}><Plus size={18} /> New task</button>
          </div>

          {notice && <div className="notice"><CheckCircle2 size={17} /> {notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
          {error && <div className="error-banner"><AlertCircle size={18} /><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss"><X size={15} /></button></div>}

          <div className="stats-grid">
            <StatCard label="Total tasks" value={allStats.total} icon={<ClipboardList size={19} />} tone="purple" footer="Across your workspace" />
            <StatCard label="In progress" value={allStats.inProgress} icon={<Activity size={19} />} tone="blue" footer="Work in motion" />
            <StatCard label="Completed" value={allStats.completed} icon={<CheckCircle2 size={19} />} tone="green" footer={`${completion}% completion rate`} />
            <StatCard label="High priority" value={allStats.high} icon={<Target size={19} />} tone="orange" footer="Needs your attention" />
          </div>

          <div className="content-grid">
            <section className="panel tasks-panel">
              <div className="panel-heading"><div><h2>Your tasks</h2><p>Keep track of what matters most.</p></div><button className="text-button" onClick={loadTasks}><ArrowDownUp size={15} /> Refresh</button></div>
              <div className="task-toolbar">
                <div className="search-box"><Search size={17} /><input aria-label="Search tasks" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} /><kbd>⌘ K</kbd></div>
                <div className="filter-wrap"><select aria-label="Filter by status" value={filter} onChange={e => setFilter(e.target.value)}><option>All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={14} /></div>
              </div>
              <div className="task-list">
                {loading ? <div className="empty-state"><LoaderCircle className="spin" size={26} /><p>Loading your tasks…</p></div> :
                  tasks.length === 0 ? <div className="empty-state"><Circle size={27} /><strong>No tasks found</strong><p>Try another filter or create a new task.</p><button className="text-button" onClick={openCreate}><Plus size={15} /> Add a task</button></div> :
                  tasks.map(task => <TaskRow key={task.id} task={task} onEdit={openEdit} onDelete={deleteTask} onCycle={cycleStatus} />)}
              </div>
              <div className="list-footer"><span>Showing <strong>{tasks.length}</strong> task{tasks.length === 1 ? '' : 's'}</span><span><span className="online-dot" /> Synced with database</span></div>
            </section>

            <aside className="right-column">
              <section className="panel progress-panel">
                <div className="panel-heading"><div><h2>Progress overview</h2><p>Your work at a glance.</p></div><span className="tiny-icon"><Activity size={16} /></span></div>
                <div className="progress-circle" style={{ '--progress': `${completion * 3.6}deg` }}><div><strong>{completion}%</strong><span>completed</span></div></div>
                <div className="progress-legend"><Legend color="green" label="Completed" value={allStats.completed} /><Legend color="blue" label="In progress" value={allStats.inProgress} /><Legend color="gray" label="Pending" value={allStats.pending} /></div>
              </section>
              <section className="panel focus-panel"><div className="focus-art"><div className="focus-orbit orbit-one" /><div className="focus-orbit orbit-two" /><div className="focus-center"><Target size={26} /></div><Sparkles className="sparkle-one" size={18} /><Sparkles className="sparkle-two" size={13} /></div><span className="focus-label">A LITTLE REMINDER</span><h3>Focus on progress,<br />not perfection.</h3><p>Choose one important thing and give it your best attention.</p><button className="focus-button" onClick={openCreate}>Plan a task <Plus size={15} /></button></section>
            </aside>
          </div>
          <footer className="page-footer"><span>Made for focused days.</span><span><span className="footer-dot" /> TaskFlow Dashboard <span className="footer-sep">·</span> Full-stack CRUD app</span></footer>
        </section>
      </main>

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setModalOpen(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><span className="modal-kicker">{editing ? 'UPDATE YOUR WORK' : 'MAKE IT HAPPEN'}</span><h2 id="modal-title">{editing ? 'Edit task' : 'Create a task'}</h2><p>{editing ? 'Make changes to this task.' : 'Break a big goal into a small next step.'}</p></div><button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Close dialog"><X size={20} /></button></div><form onSubmit={submitTask} className="task-form"><label>Task title <span>*</span><input autoFocus maxLength={120} required placeholder="e.g. Finish project documentation" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><label>Description<textarea maxLength={1000} rows={3} placeholder="Add a few details (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><div className="form-two"><label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label><label>Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(s => <option key={s}>{s}</option>)}</select></label></div><label>Due date<input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}{saving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}</button></div></form></section></div>}
    </div>
  );
}

function StatCard({ label, value, icon, tone, footer }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-footer">{footer}</div></div>;
}
function Legend({ color, label, value }) {
  return <div className="legend-row"><span className={`legend-dot ${color}`} /><span>{label}</span><strong>{value}</strong></div>;
}
function TaskRow({ task, onEdit, onDelete, onCycle }) {
  return <article className={`task-row ${task.status === 'Completed' ? 'task-completed' : ''}`}><button className={`task-check ${task.status === 'Completed' ? 'checked' : ''}`} onClick={() => onCycle(task)} title="Cycle task status" aria-label={`Change status for ${task.title}`}>{task.status === 'Completed' ? <Check size={14} /> : <span />}</button><div className="task-main"><div className="task-title-line"><h3>{task.title}</h3><span className={`priority-dot ${task.priority.toLowerCase()}`} title={`${task.priority} priority`} /></div>{task.description && <p>{task.description}</p>}<div className="task-meta"><span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</span><span className="due-meta"><CalendarDays size={13} /> {dateLabel(task.due_date)}</span></div></div><div className="task-actions"><button className="icon-button" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`} title="Edit task"><Pencil size={16} /></button><button className="icon-button delete-action" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`} title="Delete task"><Trash2 size={16} /></button></div></article>;
}

export default App;
