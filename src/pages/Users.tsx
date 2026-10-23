import React, { useState } from 'react';

/* ─── Types ─────────────────────────────────────────────────── */
type UserStatus = 'active' | 'blocked';

interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
  area: string;
  orders: number;
  spent: string;
  status: UserStatus;
  joined: string;
}

/* ─── Static data ────────────────────────────────────────────── */
const initialUsers: User[] = [
  { id: 1, name: 'Rahul Sharma',  phone: '9876543210', email: 'rahul@gmail.com',  area: 'Hazratganj',   orders: 24, spent: '₹6,840',  status: 'active',  joined: '2024-08-01' },
  { id: 2, name: 'Priya Singh',   phone: '9823456789', email: 'priya@gmail.com',  area: 'Gomti Nagar',  orders: 18, spent: '₹4,320',  status: 'active',  joined: '2024-09-10' },
  { id: 3, name: 'Amit Kumar',    phone: '9745678901', email: 'amit@gmail.com',   area: 'Aliganj',      orders: 31, spent: '₹9,100',  status: 'active',  joined: '2024-07-20' },
  { id: 4, name: 'Neha Verma',    phone: '9812345678', email: 'neha@gmail.com',   area: 'Indira Nagar', orders: 9,  spent: '₹1,950',  status: 'active',  joined: '2024-11-05' },
  { id: 5, name: 'Rohit Gupta',   phone: '9867890123', email: 'rohit@gmail.com',  area: 'Hazratganj',   orders: 5,  spent: '₹1,200',  status: 'blocked', joined: '2024-12-01' },
  { id: 6, name: 'Suresh Mishra', phone: '9934567812', email: 'suresh@gmail.com', area: 'Gomti Nagar',  orders: 42, spent: '₹12,600', status: 'active',  joined: '2024-06-14' },
];

/* ─── Palette ────────────────────────────────────────────────── */
const C = {
  accent: '#ff6b35', green: '#27ae60', greenDim: '#e6f9ee',
  red: '#e74c3c', redDim: '#fde8e8', blue: '#3d7aed', blueDim: '#eef4ff',
  bg: '#f5f5f0', card: '#fff', border: '#e8e8e8', muted: '#aaa', text: '#1a1a1a',
};

/* ─── Styles ─────────────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  page:        { padding: 16, fontFamily: "'DM Sans', sans-serif", color: C.text, fontSize: 14, background: C.bg, minHeight: '100vh' },
  pageHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
  h1:          { fontSize: 22, fontWeight: 800, letterSpacing: -0.5 },
  subtitle:    { fontSize: 12, color: C.muted, marginTop: 3 },
  btnGhost:    { background: 'transparent', border: `1.5px solid ${C.border}`, padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#444', display: 'flex', alignItems: 'center', gap: 6 },

  /* stats */
  statsRow:  { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 },
  statCard:  { background: C.card, borderRadius: 12, padding: '12px 10px', border: `1px solid ${C.border}`, textAlign: 'center' as const },
  statNum:   { fontSize: 20, fontWeight: 800, letterSpacing: -1 },
  statLabel: { fontSize: 10, color: C.muted, marginTop: 3, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5 },

  /* filters */
  filterBar:   { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' as const, alignItems: 'center' },
  searchBox:   { display: 'flex', alignItems: 'center', gap: 8, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', flex: 1, minWidth: 0 },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent' },
  select:      { border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '8px 10px', fontSize: 13, background: C.card, outline: 'none', cursor: 'pointer', color: C.text },
  countLabel:  { fontSize: 12, color: C.muted, marginLeft: 'auto', whiteSpace: 'nowrap' as const },

  /* table */
  card:      { background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' as const, width: '100%', WebkitOverflowScrolling: 'touch' } as React.CSSProperties,
  table:     { width: '100%', borderCollapse: 'collapse' as const, minWidth: 680 },
  th:        { padding: '11px 14px', textAlign: 'left' as const, fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase' as const, letterSpacing: 0.6, background: '#fafafa', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' as const },
  td:        { padding: '12px 14px', borderBottom: `1px solid #f2f2f2`, verticalAlign: 'middle' as const, whiteSpace: 'nowrap' as const },

  /* user avatar */
  avatar:    { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 },
  userName:  { fontWeight: 700, fontSize: 13 },
  userPhone: { fontSize: 11, color: C.muted, marginTop: 1 },
  userEmail: { fontSize: 11, color: C.muted, marginTop: 1 },

  areaTag:   { background: C.blueDim, color: C.blue, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, display: 'inline-block' },
  badge:     { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block' },

  iconBtnDanger:  { border: 'none', background: C.redDim,   borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 },
  iconBtnSuccess: { border: 'none', background: C.greenDim, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 },

  /* mobile cards */
  mobileList:       { display: 'flex', flexDirection: 'column' as const, gap: 10 },
  mobileCard:       { background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14, display: 'flex', flexDirection: 'column' as const, gap: 10 },
  mobileCardTop:    { display: 'flex', alignItems: 'center', gap: 12 },
  mobileCardMeta:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' },
  metaLabel:        { fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.4 },
  metaValue:        { fontSize: 12, fontWeight: 600, marginTop: 2, color: '#333' },
  mobileCardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1px solid #f2f2f2` },

  empty: { textAlign: 'center' as const, padding: '36px 20px', color: '#ccc', fontSize: 14 },
};

/* avatar color per user id */
const avatarColors = ['#e74c3c','#3d7aed','#27ae60','#f39c12','#9b59b6','#1abc9c'];
const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

/* ─── Main Component ─────────────────────────────────────────── */
const Users: React.FC = () => {
  const [users, setUsers]           = useState<User[]>(initialUsers);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const isMobile = window.innerWidth < 700;

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const ms = u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.email.toLowerCase().includes(q);
    const mst = statusFilter === 'all' || u.status === statusFilter;
    return ms && mst;
  });

  const toggleBlock = (id: number) =>
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'blocked' : 'active' } : u));

  const activeCount  = users.filter(u => u.status === 'active').length;
  const blockedCount = users.filter(u => u.status === 'blocked').length;
  const totalSpent   = users.reduce((s, u) => s + parseInt(u.spent.replace(/[₹,]/g, '')), 0);

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Users</h1>
          <p style={S.subtitle}>{users.length} registered users — {blockedCount} blocked</p>
        </div>
        <button style={S.btnGhost}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
      </div>

      {/* Stats */}
      <div style={S.statsRow}>
        <div style={S.statCard}>
          <div style={{ ...S.statNum, color: C.blue }}>{users.length}</div>
          <div style={S.statLabel}>Total</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statNum, color: C.green }}>{activeCount}</div>
          <div style={S.statLabel}>Active</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statNum, color: C.red }}>{blockedCount}</div>
          <div style={S.statLabel}>Blocked</div>
        </div>
      </div>

      {/* Filters */}
      <div style={S.filterBar}>
        <div style={S.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input style={S.searchInput} placeholder="Search by name, phone or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={S.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <span style={S.countLabel}>{filtered.length} / {users.length}</span>
      </div>

      {/* ── Mobile Card List ── */}
      {isMobile ? (
        <div style={S.mobileList}>
          {filtered.length === 0 && <div style={{ ...S.card, ...S.empty }}>Koi user nahi mila 🔍</div>}
          {filtered.map((u, i) => (
            <div key={u.id} style={{ ...S.mobileCard, opacity: u.status === 'blocked' ? 0.7 : 1 }}>
              <div style={S.mobileCardTop}>
                <div style={{ ...S.avatar, background: avatarColors[i % avatarColors.length] }}>{initials(u.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.userName}>{u.name}</div>
                  <div style={S.userEmail}>{u.email}</div>
                </div>
                <span style={{ ...S.badge, background: u.status === 'active' ? C.greenDim : C.redDim, color: u.status === 'active' ? C.green : C.red }}>
                  {u.status === 'active' ? 'Active' : 'Blocked'}
                </span>
              </div>

              <div style={S.mobileCardMeta}>
                <div>
                  <div style={S.metaLabel}>Phone</div>
                  <div style={S.metaValue}>{u.phone}</div>
                </div>
                <div>
                  <div style={S.metaLabel}>Area</div>
                  <div style={{ marginTop: 4 }}><span style={S.areaTag}>{u.area}</span></div>
                </div>
                <div>
                  <div style={S.metaLabel}>Orders</div>
                  <div style={{ ...S.metaValue, fontSize: 16 }}>{u.orders}</div>
                </div>
                <div>
                  <div style={S.metaLabel}>Total Spent</div>
                  <div style={{ ...S.metaValue, color: C.green, fontSize: 15 }}>{u.spent}</div>
                </div>
                <div>
                  <div style={S.metaLabel}>Joined</div>
                  <div style={S.metaValue}>{u.joined}</div>
                </div>
              </div>

              <div style={S.mobileCardFooter}>
                <span style={{ fontSize: 12, color: C.muted }}>ID: #{u.id}</span>
                <button
                  style={u.status === 'active' ? S.iconBtnDanger : S.iconBtnSuccess}
                  onClick={() => toggleBlock(u.id)}
                  title={u.status === 'active' ? 'Block User' : 'Unblock User'}
                >
                  {u.status === 'active' ? '🚫' : '✅'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Desktop Table ── */
        <div style={S.card}>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['User', 'Contact', 'Area', 'Orders', 'Total Spent', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={S.empty}>Koi user nahi mila 🔍</td></tr>
                )}
                {filtered.map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', opacity: u.status === 'blocked' ? 0.65 : 1 }}>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ ...S.avatar, background: avatarColors[i % avatarColors.length] }}>{initials(u.name)}</div>
                        <span style={S.userName}>{u.name}</span>
                      </div>
                    </td>
                    <td style={S.td}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u.phone}</div>
                      <div style={S.userEmail}>{u.email}</div>
                    </td>
                    <td style={S.td}><span style={S.areaTag}>{u.area}</span></td>
                    <td style={{ ...S.td, fontWeight: 700 }}>{u.orders}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: C.green }}>{u.spent}</td>
                    <td style={S.td}>
                      <span style={{ ...S.badge, background: u.status === 'active' ? C.greenDim : C.redDim, color: u.status === 'active' ? C.green : C.red }}>
                        {u.status === 'active' ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontSize: 12, color: C.muted }}>{u.joined}</td>
                    <td style={S.td}>
                      <button
                        style={u.status === 'active' ? S.iconBtnDanger : S.iconBtnSuccess}
                        onClick={() => toggleBlock(u.id)}
                        title={u.status === 'active' ? 'Block User' : 'Unblock User'}
                      >
                        {u.status === 'active' ? '🚫' : '✅'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;