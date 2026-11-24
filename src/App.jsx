import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp, ArrowRight, Bell, CalendarDays, Check, CheckCheck, ChevronDown,
  CircleHelp, Clock3, FileText, MapPin, Menu, Plus, Search, Sparkles, Trash2,
  X,
} from 'lucide-react';

const categories = ['All plans', 'Doctors', 'Government', 'University', 'Car care', 'Salon', 'Interviews', 'Personal'];
const categoryIcons = {
  Doctors: '✳', Government: '▤', University: '⌂', 'Car care': '◈',
  Salon: '✿', Interviews: '◉', Personal: '✦',
};

async function request(path, options) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}

function prettyDate(dateString) {
  if (!dateString) return 'Date not set';
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function formatTime(time) {
  if (!time) return 'Time not set';
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });
}

function App() {
  const [appointments, setAppointments] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All plans');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const loadAppointments = useCallback(async () => {
    try {
      setError('');
      const data = await request('/api/appointments');
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const upcoming = useMemo(() => {
    const query = search.trim().toLowerCase();
    return appointments.filter((item) => {
      const matchesCategory = activeCategory === 'All plans' || item.category === activeCategory;
      const matchesSearch = !query || [item.title, item.category, item.location, ...(item.items || [])]
        .join(' ').toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [appointments, activeCategory, search]);

  const activeCount = appointments.filter((item) => !item.completed).length;
  const nextPlan = appointments.find((item) => !item.completed && item.date >= new Date().toISOString().slice(0, 10));

  async function toggleComplete(item) {
    try {
      const updated = await request(`/api/appointments/${item._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !item.completed }),
      });
      setAppointments((items) => items.map((entry) => entry._id === updated._id ? updated : entry));
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteAppointment(item) {
    try {
      await request(`/api/appointments/${item._id}`, { method: 'DELETE' });
      setAppointments((items) => items.filter((entry) => entry._id !== item._id));
      setNotice('Plan removed');
      window.setTimeout(() => setNotice(''), 2600);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveAppointment(payload) {
    const created = await request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAppointments((items) => [...items, created]);
    setShowAdd(false);
    setNotice('Your plan is on the list');
    window.setTimeout(() => setNotice(''), 2600);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#" aria-label="Smart Queue home">
          <span className="brand-mark"><CheckCheck size={19} strokeWidth={2.5} /></span>
          <span>smart<span className="brand-light">queue</span><i>.</i></span>
        </a>
        <div className="sidebar-label">YOUR SPACE</div>
        <button className={`nav-link ${activeCategory === 'All plans' ? 'selected' : ''}`} onClick={() => setActiveCategory('All plans')}>
          <CalendarDays size={18} /> <span>All plans</span><span className="nav-count">{appointments.length}</span>
        </button>
        <div className="sidebar-label category-label">CATEGORIES</div>
        <nav className="category-nav">
          {categories.slice(1).map((category) => (
            <button key={category} className={`nav-link ${activeCategory === category ? 'selected' : ''}`} onClick={() => setActiveCategory(category)}>
              <span className="category-glyph">{categoryIcons[category]}</span><span>{category}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon"><CircleHelp size={17} /></span>
            <div><strong>A little help?</strong><small>Make every day count.</small></div>
            <ArrowRight size={15} />
          </div>
          <div className="profile">
            <div className="avatar">S</div>
            <div className="profile-name"><strong>Your space</strong><small>Personal planner</small></div>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>

      {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={20} /></button>
          <div className="breadcrumb">Your space <span>/</span> <strong>{activeCategory}</strong></div>
          <div className="top-actions">
            <div className="today-label"><span className="live-dot" /> YOUR DAY, IN ORDER</div>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="top-avatar">S</div>
          </div>
        </header>

        <div className="page-wrap">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> A LITTLE MORE IN CONTROL</div>
              <h1>Make room for <em>what matters.</em></h1>
              <p className="welcome-copy">All the places you need to be, and everything you need to bring.</p>
            </div>
            <button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={18} /> Add a plan</button>
          </section>

          <section className="overview-grid" aria-label="Your schedule at a glance">
            <div className="overview-card count-card">
              <div className="overview-top"><span>UP AHEAD</span><span className="overview-icon"><CalendarDays size={17} /></span></div>
              <strong className="overview-value">{activeCount.toString().padStart(2, '0')}</strong>
              <div className="overview-foot">plans to keep in mind <span>↗</span></div>
              <div className="card-decoration" />
            </div>
            <div className="overview-card next-card">
              <div className="overview-top"><span>NEXT ON YOUR LIST</span><span className="overview-icon"><Clock3 size={17} /></span></div>
              {nextPlan ? (
                <>
                  <strong className="next-title">{nextPlan.title}</strong>
                  <div className="overview-foot">{prettyDate(nextPlan.date)} <span className="dot-separator">·</span> {formatTime(nextPlan.time)}</div>
                </>
              ) : (
                <>
                  <strong className="next-title">A little breathing room</strong>
                  <div className="overview-foot">Your next plan will show up here</div>
                </>
              )}
              <div className="next-sparkle"><Sparkles size={31} /></div>
            </div>
            <button className="overview-card reminder-card" onClick={() => setShowAdd(true)}>
              <div className="overview-top"><span>DON'T FORGET</span><span className="overview-icon"><Bell size={17} /></span></div>
              <strong className="reminder-title">The little things<br />are covered.</strong>
              <div className="overview-foot">Add reminders as you plan <ArrowRight size={13} /></div>
              <span className="reminder-flower">✳</span>
            </button>
          </section>

          <section className="plans-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow section-eyebrow"><span className="eyebrow-line" /> THE IMPORTANT BITS</div>
                <h2>Your plans <span className="heading-count">{appointments.length}</span></h2>
              </div>
              <div className="plan-actions">
                <label className="search-box">
                  <Search size={16} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a plan..." aria-label="Find a plan" />
                  {search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}
                </label>
                <button className="sort-button" onClick={() => setAppointments((items) => [...items].reverse())} aria-label="Reverse plan order"><ArrowDownUp size={16} /><span>Sort</span></button>
              </div>
            </div>

            {error && <div className="alert app-alert" role="alert">{error}<button onClick={loadAppointments}>Try again</button></div>}

            <div className="filter-row">
              {categories.map((category) => (
                <button key={category} className={`filter-chip ${activeCategory === category ? 'active' : ''}`} onClick={() => setActiveCategory(category)}>
                  {category === 'All plans' && <span className="chip-dot" />}{category}
                </button>
              ))}
            </div>

            <div className="plans-list">
              {loading ? (
                <div className="empty-state"><div className="empty-icon"><CalendarDays size={22} /></div><strong>Getting your plans together…</strong></div>
              ) : upcoming.length ? upcoming.map((item) => (
                <article className={`plan-row ${item.completed ? 'plan-completed' : ''}`} key={item._id}>
                  <button className={`complete-button ${item.completed ? 'is-complete' : ''}`} onClick={() => toggleComplete(item)} aria-label={item.completed ? 'Mark as upcoming' : 'Mark as complete'}>
                    {item.completed && <Check size={14} />}
                  </button>
                  <div className="plan-date"><strong>{new Date(`${item.date}T12:00:00`).getDate().toString().padStart(2, '0')}</strong><span>{new Date(`${item.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span></div>
                  <div className="plan-main">
                    <div className="plan-title-line"><h3>{item.title}</h3><span className="plan-category">{categoryIcons[item.category] || '✦'} {item.category}</span></div>
                    <div className="plan-meta">
                      <span><Clock3 size={14} />{formatTime(item.time)}</span>
                      {item.location && <span><MapPin size={14} />{item.location}</span>}
                      {!!item.items?.length && <span className="bring-meta"><FileText size={14} />Bring: {item.items.join(', ')}</span>}
                    </div>
                  </div>
                  <div className="plan-reminder"><Bell size={14} /><span>{item.reminders?.length ? item.reminders.join(' · ') : 'No reminders'}</span></div>
                  <button className="delete-button" onClick={() => deleteAppointment(item)} aria-label={`Delete ${item.title}`}><Trash2 size={16} /></button>
                </article>
              )) : (
                <div className="empty-state">
                  <div className="empty-icon"><CalendarDays size={22} /></div>
                  <strong>{appointments.length ? 'Nothing in this little corner.' : 'Your plans start here.'}</strong>
                  <p>{appointments.length ? 'Try another category or search.' : 'Add an appointment or tell Smart Queue what’s on your mind.'}</p>
                  {!appointments.length && <button className="text-button" onClick={() => setShowAdd(true)}>Add your first plan <ArrowRight size={15} /></button>}
                </div>
              )}
            </div>
          </section>

          <footer className="page-footer"><span>ONE THING AT A TIME.</span><span>Made for all the little things that make up a life <span className="footer-heart">♥</span></span></footer>
        </div>
      </main>
      {notice && <div className="toast-note"><Check size={16} />{notice}</div>}
      {showAdd && <AddPlanModal onClose={() => setShowAdd(false)} onSave={saveAppointment} />}
    </div>
  );
}

function AddPlanModal({ onClose, onSave }) {
  const [mode, setMode] = useState('write');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    title: '', category: 'Personal', date: '', time: '', location: '', itemsText: '',
    reminders: ['1 day before', '2 hours before'],
  });
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }

  async function parseMessage() {
    if (!message.trim()) { setError('Write a little about your plan first.'); return; }
    setParsing(true);
    setError('');
    try {
      const parsed = await request('/api/appointments/parse', {
        method: 'POST',
        body: JSON.stringify({ text: message }),
      });
      setForm((current) => ({
        ...current,
        ...parsed,
        itemsText: (parsed.items || []).join(', '),
      }));
      setMode('review');
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.date || !form.time) {
      setError('Please add a name, date, and time for your plan.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        title: form.title.trim(),
        category: form.category,
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        items: form.itemsText.split(',').map((item) => item.trim()).filter(Boolean),
        reminders: form.reminders,
        originalText: message,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop-custom" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="add-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-top">
          <div><div className="eyebrow"><span className="eyebrow-line" /> A FRESH LITTLE PLAN</div><h2 id="modal-title">Let’s get it <em>on the list.</em></h2></div>
          <button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <div className="modal-tabs">
          <button className={mode === 'write' ? 'active' : ''} onClick={() => setMode('write')}><Sparkles size={16} /> Tell us about it</button>
          <button className={mode === 'review' ? 'active' : ''} onClick={() => setMode('review')}><FileText size={16} /> Add details</button>
        </div>
        {mode === 'write' && (
          <div className="ai-panel">
            <label htmlFor="plan-message">Write it just like you’d tell a friend</label>
            <textarea id="plan-message" rows="4" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="My dentist appointment is Thursday at 4:30 PM in Amman, and I need to bring my insurance card." />
            <div className="ai-hint"><Sparkles size={14} /> We’ll pick out the details for you. You can check everything before saving.</div>
            <button className="primary-button parse-button" onClick={parseMessage} disabled={parsing}>{parsing ? <span className="spinner-border spinner-border-sm" /> : <Sparkles size={17} />}{parsing ? 'Finding the details…' : 'Find the details'}<ArrowRight size={16} /></button>
          </div>
        )}
        {mode === 'review' && (
          <form className="details-form" onSubmit={submit}>
            <div className="form-grid">
              <label className="field-label full-width">WHAT’S THE PLAN?<input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Dentist appointment" /></label>
              <label className="field-label">DATE<input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} /></label>
              <label className="field-label">TIME<input type="time" value={form.time} onChange={(event) => update('time', event.target.value)} /></label>
              <label className="field-label">KIND OF PLAN<select value={form.category} onChange={(event) => update('category', event.target.value)}>{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></label>
              <label className="field-label">WHERE?<input value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Add a place" /></label>
              <label className="field-label full-width">DON’T FORGET TO BRING<input value={form.itemsText} onChange={(event) => update('itemsText', event.target.value)} placeholder="Separate items with commas" /></label>
              <fieldset className="field-label full-width reminder-options"><legend>GENTLE REMINDERS</legend>
                {['1 day before', '2 hours before'].map((reminder) => (
                  <label key={reminder}><input type="checkbox" checked={form.reminders.includes(reminder)} onChange={(event) => update('reminders', event.target.checked ? [...form.reminders, reminder] : form.reminders.filter((value) => value !== reminder))} />{reminder}</label>
                ))}
              </fieldset>
            </div>
            <div className="modal-actions"><button type="button" className="back-button" onClick={() => setMode('write')}>Back</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save my plan'}<ArrowRight size={16} /></button></div>
          </form>
        )}
        {error && <div className="modal-error" role="alert">{error}</div>}
        <div className="modal-footnote"><Sparkles size={13} /> Your plans stay yours. Make changes any time.</div>
      </section>
    </div>
  );
}

export default App;
