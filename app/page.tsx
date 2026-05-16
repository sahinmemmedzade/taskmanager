'use client';

import { useState, useEffect, useCallback } from 'react';

type Priority = 'low' | 'medium' | 'high';
type Status = 'pending' | 'completed';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  dueDate?: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

const apiFetch = async (path: string, opts: RequestInit = {}, token?: string) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Xəta baş verdi');
  return data;
};

const pc = {
  high: { label: 'Yüksək', color: '#ff5c7a', bg: 'rgba(255,92,122,0.12)' },
  medium: { label: 'Orta', color: '#f5c542', bg: 'rgba(245,197,66,0.12)' },
  low: { label: 'Aşağı', color: '#22d3a4', bg: 'rgba(34,211,164,0.12)' },
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontSize: 14,
  outline: 'none', fontFamily: 'inherit',
};

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as Priority, dueDate: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tf_token');
    const savedUser = localStorage.getItem('tf_user');
    if (saved && savedUser) { setToken(saved); setUser(JSON.parse(savedUser)); }
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setTasksLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterPriority !== 'all') params.set('priority', filterPriority);
      if (search) params.set('search', search);
      const data = await apiFetch(`/tasks?${params}`, {}, token);
      setTasks(data.tasks);
    } catch { /* silent */ }
    finally { setTasksLoading(false); }
  }, [token, filterStatus, filterPriority, search]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(''); setAuthLoading(true);
    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const body = authMode === 'login' ? { email: authForm.email, password: authForm.password } : authForm;
      const data = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
      localStorage.setItem('tf_token', data.token);
      localStorage.setItem('tf_user', JSON.stringify(data.user));
      setToken(data.token); setUser(data.user);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Xəta');
    } finally { setAuthLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('tf_token'); localStorage.removeItem('tf_user');
    setToken(null); setUser(null); setTasks([]);
  };

  const openCreate = () => {
    setEditTask(null);
    setForm({ title: '', description: '', priority: 'medium', dueDate: '' });
    setFormError(''); setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({ title: task.title, description: task.description || '', priority: task.priority, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '' });
    setFormError(''); setShowModal(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!form.title.trim()) { setFormError('Başlıq tələb olunur'); return; }
    setFormLoading(true);
    try {
      if (editTask) {
        await apiFetch(`/tasks/${editTask._id}`, { method: 'PUT', body: JSON.stringify(form) }, token!);
      } else {
        await apiFetch('/tasks', { method: 'POST', body: JSON.stringify(form) }, token!);
      }
      setShowModal(false); fetchTasks();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Xəta');
    } finally { setFormLoading(false); }
  };

  const toggleStatus = async (task: Task) => {
    const newStatus: Status = task.status === 'pending' ? 'completed' : 'pending';
    try {
      await apiFetch(`/tasks/${task._id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) }, token!);
      fetchTasks();
    } catch { /* silent */ }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiFetch(`/tasks/${deleteId}`, { method: 'DELETE' }, token!);
      setDeleteId(null); fetchTasks();
    } catch { /* silent */ }
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    high: tasks.filter(t => t.priority === 'high' && t.status === 'pending').length,
  };

  const modal: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(10px)', zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  };
  const card: React.CSSProperties = {
    width: '100%', maxWidth: 480,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 20, padding: 28,
  };

  // AUTH SCREEN
  if (!token) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%)', top: -200, left: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,164,0.05) 0%, transparent 70%)', bottom: -100, right: 0, pointerEvents: 'none' }} />

      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), #5c3aff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚡</div>
          <span className="font-display" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>TaskFlow</span>
        </div>
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>v{APP_VERSION} · Şəxsi task idarəetmə</p>
      </div>

      <div style={{ ...card, maxWidth: 420 }}>
        <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 12, padding: 4, marginBottom: 28 }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setAuthMode(m); setAuthError(''); }}
              style={{ flex: 1, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, transition: 'all 0.2s', background: authMode === m ? 'var(--accent)' : 'transparent', color: authMode === m ? 'white' : 'var(--text2)' }}>
              {m === 'login' ? 'Giriş' : 'Qeydiyyat'}
            </button>
          ))}
        </div>

        <form onSubmit={handleAuth}>
          {authMode === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Ad Soyad</label>
              <input value={authForm.name} onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))} placeholder="Adınızı daxil edin" required style={inputStyle} />
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Email</label>
            <input type="email" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" required style={inputStyle} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Şifrə</label>
            <input type="password" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} placeholder="Ən az 6 simvol" required style={inputStyle} />
          </div>
          {authError && <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(255,92,122,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>⚠️ {authError}</div>}
          <button type="submit" disabled={authLoading}
            style={{ width: '100%', padding: 12, background: authLoading ? 'var(--bg3)' : 'linear-gradient(135deg, var(--accent), #5c3aff)', border: 'none', borderRadius: 10, color: 'white', fontSize: 15, fontWeight: 600, cursor: authLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {authLoading ? 'Gözləyin...' : authMode === 'login' ? 'Daxil ol' : 'Qeydiyyatdan keç'}
          </button>
        </form>
      </div>
    </div>
  );

  // MAIN APP
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ borderBottom: '1px solid var(--border)', background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, var(--accent), #5c3aff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
            <span className="font-display" style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>TaskFlow</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px' }}>v{APP_VERSION}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>👋 {user?.name}</span>
            <button onClick={logout} style={{ padding: '6px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Çıxış</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Cəmi Task', value: stats.total, color: 'var(--accent)', icon: '📋' },
            { label: 'Gözləyən', value: stats.pending, color: 'var(--yellow)', icon: '⏳' },
            { label: 'Tamamlanan', value: stats.completed, color: 'var(--green)', icon: '✅' },
            { label: 'Təcili', value: stats.high, color: 'var(--red)', icon: '🔥' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1, fontFamily: 'Syne, sans-serif' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text3)' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Task axtar..."
              style={{ ...inputStyle, paddingLeft: 36 }} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>
            <option value="all">Bütün statuslar</option>
            <option value="pending">Gözləyən</option>
            <option value="completed">Tamamlanmış</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>
            <option value="all">Bütün prioritetlər</option>
            <option value="high">Yüksək</option>
            <option value="medium">Orta</option>
            <option value="low">Aşağı</option>
          </select>
          <button onClick={openCreate}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg, var(--accent), #5c3aff)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Yeni Task
          </button>
        </div>

        {/* Tasks */}
        {tasksLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div><div>Yüklənir...</div>
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Task tapılmadı</div>
            <div style={{ fontSize: 14 }}>Yeni task yaradın və ya filteri dəyişin</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.map(task => {
              const cfg = pc[task.priority];
              const done = task.status === 'completed';
              return (
                <div key={task._id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 16, opacity: done ? 0.65 : 1, transition: 'opacity 0.2s' }}>
                  <button onClick={() => toggleStatus(task)}
                    style={{ width: 22, height: 22, borderRadius: 6, border: done ? 'none' : '2px solid var(--border2)', background: done ? 'var(--green)' : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', fontSize: 13, color: 'var(--bg)', fontWeight: 700 }}>
                    {done && '✓'}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: done ? 'var(--text3)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>{task.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: done ? 'rgba(34,211,164,0.1)' : 'rgba(245,197,66,0.1)', color: done ? 'var(--green)' : 'var(--yellow)' }}>
                        {done ? 'Tamamlandı' : 'Gözləyir'}
                      </span>
                    </div>
                    {task.description && <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 6 }}>{task.description}</p>}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>📅 {new Date(task.createdAt).toLocaleDateString('az-AZ')}</span>
                      {task.dueDate && (
                        <span style={{ fontSize: 12, color: new Date(task.dueDate) < new Date() && !done ? 'var(--red)' : 'var(--text3)' }}>
                          🎯 {new Date(task.dueDate).toLocaleDateString('az-AZ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => openEdit(task)}
                      style={{ padding: '7px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Düzəlt</button>
                    <button onClick={() => setDeleteId(task._id)}
                      style={{ padding: '7px 14px', background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.25)', borderRadius: 8, color: 'var(--red)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Sil</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Task Modal */}
      {showModal && (
        <div style={modal} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700 }}>{editTask ? 'Taskı düzəlt' : 'Yeni task'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={submitForm}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Başlıq *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Task başlığı..." style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Açıqlama</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Əlavə məlumat..." rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Prioritet</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="low">🟢 Aşağı</option>
                    <option value="medium">🟡 Orta</option>
                    <option value="high">🔴 Yüksək</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Son tarix</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark', color: form.dueDate ? 'var(--text)' : 'var(--text3)' }} />
                </div>
              </div>
              {formError && <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(255,92,122,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>⚠️ {formError}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 11, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text2)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Ləğv et</button>
                <button type="submit" disabled={formLoading} style={{ flex: 2, padding: 11, background: formLoading ? 'var(--bg3)' : 'linear-gradient(135deg, var(--accent), #5c3aff)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, cursor: formLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {formLoading ? 'Gözləyin...' : editTask ? 'Yadda saxla' : 'Task yarat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div style={modal}>
          <div style={{ ...card, maxWidth: 360, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🗑️</div>
            <h3 className="font-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Taskı sil</h3>
            <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 24 }}>Bu əməliyyat geri alına bilməz.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: 11, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text2)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Ləğv et</button>
              <button onClick={confirmDelete} style={{ flex: 1, padding: 11, background: 'var(--red)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Sil</button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ borderTop: '1px solid var(--border)', marginTop: 60, padding: 20, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--text3)' }}>TaskFlow v{APP_VERSION} · Next.js + MongoDB + JWT · Health: <a href="/api/health" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'none' }}>/api/health</a></p>
      </footer>
    </div>
  );
}
