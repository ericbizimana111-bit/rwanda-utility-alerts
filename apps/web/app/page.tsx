'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Bell, BookOpen, Building2, Calendar, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Database, FileText, LayoutDashboard, LogOut, MapPin, Menu, RefreshCw, Search, Settings2, ShieldCheck, Smartphone, Users, X, XCircle } from 'lucide-react';

type View = 'overview' | 'outages' | 'reports' | 'users' | 'subscriptions' | 'locations' | 'utilities' | 'sources' | 'notifications';
type Overview = { totalUsers: number; activeSubscriptions: number; upcomingOutages: number; activeOutages: number; pendingReports: number; notificationsSent: number; registeredDevices: number };
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const nav: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'outages', label: 'Outages', icon: Activity },
  { id: 'reports', label: 'Community reports', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'subscriptions', label: 'Subscriptions', icon: Bell },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'utilities', label: 'Utilities', icon: Building2 },
  { id: 'sources', label: 'Data sources', icon: Database },
  { id: 'notifications', label: 'Notifications', icon: Smartphone },
];

const protectedKeys = new Set(['password', 'pushToken', 'user', 'outage', 'location', 'utility', 'outageLocations']);

function Login({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to sign in');
      if (!['ADMIN', 'SUPER_ADMIN'].includes(data.user?.role)) throw new Error('This account does not have admin access.');
      onLogin(data.accessToken, data.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-shell"><form className="login-card" onSubmit={submit}><div className="brand-mark">RU</div><h1>Operations workspace</h1><p>Sign in with an authorized administrator account to manage Rwanda utility alerts.</p>{error && <div className="error">{error}</div>}<div className="form-field"><label htmlFor="phone">PHONE</label><input id="phone" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="username" /></div><div className="form-field"><label htmlFor="password">PASSWORD</label><input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /></div><button className="primary" disabled={busy || !phone || !password}>{busy ? 'Signing in...' : 'Sign in securely'}</button></form></main>;
}

function AdminApp({ token, user, onLogout }: { token: string; user: any; onLogout: () => void }) {
  const [view, setView] = useState<View>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState('');
  const [utilityFilter, setUtilityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const pageSize = 8;

  async function load(nextView = view) {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const endpoint = nextView === 'overview' ? '/admin/overview' : `/admin/${nextView === 'sources' ? 'data-sources' : nextView}`;
      const response = await fetch(`${API_URL}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401 || response.status === 403) throw new Error('Your admin session is no longer authorized.');
      if (!response.ok) throw new Error(`Unable to load ${nextView}.`);

      const data = await response.json();
      if (nextView === 'overview') {
        setOverview(data);
      } else {
        setRows(Array.isArray(data) ? data : []);
      }
      setSelectedRow(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
    setQuery('');
    setUtilityFilter('all');
    setStatusFilter('all');
    setLocationFilter('all');
    setSelectedRow(null);
    void load(view);
  }, [view]);

  const title = nav.find(item => item.id === view)?.label || 'Overview';

  const metricItems = overview ? [
    { label: 'Total users', value: overview.totalUsers, icon: Users },
    { label: 'Active subscriptions', value: overview.activeSubscriptions, icon: Bell },
    { label: 'Upcoming outages', value: overview.upcomingOutages, icon: Activity },
    { label: 'Active outages', value: overview.activeOutages, icon: CircleAlert },
    { label: 'Pending reports', value: overview.pendingReports, icon: FileText },
    { label: 'Notifications sent', value: overview.notificationsSent, icon: ShieldCheck },
    { label: 'Registered devices', value: overview.registeredDevices, icon: Smartphone },
  ] : [];

  const utilityOptions = useMemo(() => {
    if (!rows?.length) return [];
    const values = new Set<string>();
    rows.forEach((row) => {
      const value = row.utility?.name ?? row.utilityName ?? row.utilityId ?? '';
      if (value) values.add(String(value));
    });
    return Array.from(values);
  }, [rows]);

  const statusOptions = useMemo(() => {
    if (!rows?.length) return [];
    const values = new Set<string>();
    rows.forEach((row) => {
      const status = row.status ?? row.isActive ?? '';
      if (status) values.add(String(status));
    });
    return Array.from(values);
  }, [rows]);

  const locationOptions = useMemo(() => {
    if (!rows?.length) return [];
    const values = new Set<string>();
    rows.forEach((row) => {
      const location = row.location?.district ?? row.location?.province ?? row.district ?? row.locationName ?? '';
      if (location) values.add(String(location));
    });
    return Array.from(values);
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    let output = rows.filter((row) => {
      const searchText = Object.values(row).flatMap((item) => {
        if (item && typeof item === 'object') {
          return [
            (item as any).name,
            (item as any).firstName,
            (item as any).lastName,
            (item as any).district,
            (item as any).province,
            (item as any).title,
            (item as any).message,
            (item as any).code,
          ].filter(Boolean);
        }
        return [String(item ?? '')];
      }).join(' ').toLowerCase();

      const matchQuery = !query.trim() || searchText.includes(query.toLowerCase());
      const matchUtility = utilityFilter === 'all' || String(row.utility?.name ?? row.utilityId ?? row.utilityName ?? '').toLowerCase() === utilityFilter.toLowerCase();
      const matchStatus = statusFilter === 'all' || String(row.status ?? row.isActive ?? '').toLowerCase() === statusFilter.toLowerCase();
      const matchLocation = locationFilter === 'all' || String(row.location?.district ?? row.location?.province ?? row.district ?? row.locationName ?? '').toLowerCase() === locationFilter.toLowerCase();
      return matchQuery && matchUtility && matchStatus && matchLocation;
    });
    return output;
  }, [rows, query, utilityFilter, statusFilter, locationFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const columns = useMemo(() => {
    if (!rows?.length) return [];
    const keys = Object.keys(rows[0]).filter(key => !protectedKeys.has(key));
    return keys.slice(0, 7);
  }, [rows]);

  async function moderateReport(reportId: string, status: 'verified' | 'rejected' | 'resolved') {
    try {
      setLoading(true);
      setError('');
      setNotice('');
      const response = await fetch(`${API_URL}/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (response.status === 401 || response.status === 403) throw new Error('Your admin session is no longer authorized.');
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.message || `Unable to update report to ${status}.`);
      }
      setNotice(`Report marked as ${status}.`);
      await load('reports');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update report.')
    } finally {
      setLoading(false);
    }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark">RU</div><h1>Utility Alerts</h1><p>Operations console</p></div>
      <nav className="nav">
        {nav.map(item => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => { setView(item.id); setMobileNav(false); }}><Icon size={18} /><span>{item.label}</span></button>; })}
      </nav>
      <div className="sidebar-footer">Protected admin access<br />Live backend data only</div>
    </aside>

    <section className="main">
      <header className="topbar">
        <div><div className="eyebrow">Rwanda utility alerts</div><h2>{title}</h2></div>
        <div className="user-chip">
          <div className="avatar">{user?.firstName?.[0] || 'A'}</div>
          <span>{user?.firstName || 'Administrator'}</span>
          <button className="refresh" onClick={onLogout} title="Sign out"><LogOut size={15} /></button>
        </div>
        <button className="refresh" onClick={() => setMobileNav(v => !v)} aria-label="Toggle navigation">{mobileNav ? <X size={17} /> : <Menu size={17} />}</button>
      </header>

      <main className="content">
        <div className="hero">
          <div>
            <div className="eyebrow">Control room</div>
            <h3>{view === 'overview' ? 'Good to have you back.' : title}</h3>
            <p>{view === 'overview' ? 'A clear view of live utility operations and community activity.' : `Review real ${title.toLowerCase()} from the protected API.`}</p>
          </div>
          <button className="refresh" onClick={() => void load(view)}><RefreshCw size={16} /> Refresh</button>
        </div>

        {error && <div className="error">{error}</div>}
        {notice && <div className="success">{notice}</div>}

        {view === 'overview' ? <>
          <div className="metrics">
            {loading ? Array.from({ length: 7 }).map((_, i) => <div className="metric" key={i}><div className="metric-head">Loading...</div><strong className="empty-value">--</strong></div>) : metricItems.map(item => { const Icon = item.icon; return <div className="metric" key={item.label}><div className="metric-head"><span>{item.label}</span><Icon className="metric-icon" size={19} /></div><strong>{item.value}</strong></div>; })}
          </div>

          <div className="panel">
            <div className="panel-head"><h4>Operations snapshot</h4><span className="panel-tag">Live</span></div>
            <div className="panel-body">
              <div className="empty-state"><BookOpen size={25} /><span>Review the metrics, resource tables, and recent operational events in the navigation.</span></div>
            </div>
          </div>
        </> : <>
          <div className="panel table-panel">
            <div className="panel-head">
              <div className="panel-title"><h4>{title}</h4><span className="panel-tag">{filteredRows.length} results</span></div>
              <div className="panel-actions">
                <div className="search-wrap"><Search size={14} /><input className="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search records" /></div>
              </div>
            </div>
            <div className="filter-row">
              {utilityOptions.length > 0 && <select className="filter" value={utilityFilter} onChange={(e) => { setUtilityFilter(e.target.value); setPage(1); }}><option value="all">All utilities</option>{utilityOptions.map((u) => <option key={u} value={u}>{u}</option>)}</select>}
              {statusOptions.length > 0 && <select className="filter" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}><option value="all">All states</option>{statusOptions.map((s) => <option key={s} value={s}>{String(s)}</option>)}</select>}
              {locationOptions.length > 0 && <select className="filter" value={locationFilter} onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}><option value="all">All locations</option>{locationOptions.map((l) => <option key={l} value={l}>{l}</option>)}</select>}
            </div>
            <div className="panel-body">
              <div className="table-wrap">
                {loading ? <div className="empty-state"><BookOpen size={22} /><span>Loading data...</span></div> : pageRows.length ? <table className="data-table"><thead><tr>{columns.map(col => <th key={col}>{formatColumn(col)}</th>)}</tr></thead><tbody>{pageRows.map((row, rowIndex) => <tr key={row.id ?? rowIndex} className="clickable-row" onClick={() => setSelectedRow(row)}>{columns.map(col => <td key={col}>{formatValue(row[col])}</td>)}</tr>)}</tbody></table> : <div className="empty-state"><BookOpen size={22} /><span>No records available.</span></div>}
              </div>
              {filteredRows.length > pageSize && <div className="pager"><button className="icon-button" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /> Prev</button><span className="page-current">Page {page} / {totalPages}</span><button className="icon-button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next <ChevronRight size={14} /></button></div>}
            </div>
          </div>
          {selectedRow && <div className="details-panel"><div className="details-head"><div><div className="eyebrow">Selected record</div><h4>{selectedRow.title ?? selectedRow.name ?? selectedRow.firstName ?? 'Details'}</h4></div><button className="icon-button" onClick={() => setSelectedRow(null)}><X size={14} /> Close</button></div><div className="detail-grid">{Object.entries(selectedRow).filter(([key]) => !protectedKeys.has(key)).slice(0, 12).map(([key, value]) => <div className="detail-card" key={key}><span className="detail-label">{formatColumn(key)}</span><span className="detail-value">{formatValue(value)}</span></div>)}</div>{view === 'reports' && <div className="actions-row">{['verified', 'rejected', 'resolved'].map((action) => <button key={action} className="mini-button" onClick={() => moderateReport(selectedRow.id, action as 'verified' | 'rejected' | 'resolved')}>{action === 'verified' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{formatColumn(action)}</button>)}</div>}</div>}
        </>}
      </main>
    </section>
  </div>;
}

function formatColumn(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).replace(/_/g, ' ');
}

function formatValue(value: any) {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('name' in value) return value.name;
    if ('firstName' in value) return `${value.firstName || ''} ${value.lastName || ''}`.trim();
    if ('title' in value) return value.title;
    return JSON.stringify(value);
  }
  return String(value);
}

export default function Page() {
  const [session, setSession] = useState<{ token: string; user: any } | null>(null);
  useEffect(() => {
    const token = window.localStorage.getItem('rwanda-admin-token');
    const user = window.localStorage.getItem('rwanda-admin-user');
    if (token && user) setSession({ token, user: JSON.parse(user) });
  }, []);

  function login(token: string, user: any) {
    window.localStorage.setItem('rwanda-admin-token', token);
    window.localStorage.setItem('rwanda-admin-user', JSON.stringify(user));
    setSession({ token, user });
  }

  function logout() {
    window.localStorage.removeItem('rwanda-admin-token');
    window.localStorage.removeItem('rwanda-admin-user');
    setSession(null);
  }

  return session ? <AdminApp token={session.token} user={session.user} onLogout={logout} /> : <Login onLogin={login} />;
}
