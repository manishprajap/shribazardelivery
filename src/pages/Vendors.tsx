import React, { useState } from 'react';

/* ─── Types ─────────────────────────────────────────────────── */
type Status = 'active' | 'inactive' | 'pending';

interface Vendor {
  id: number;
  name: string;
  owner: string;
  phone: string;
  area: string;
  category: string;
  orders: number;
  rating: number;
  status: Status;
  joined: string;
}

/* ─── Static data ────────────────────────────────────────────── */
const areas = ['Hazratganj', 'Gomti Nagar', 'Aliganj', 'Indira Nagar', 'Chowk', 'Rajajipuram'];
const categories = ['North Indian', 'South Indian', 'Mughlai', 'Fast Food', 'Chinese', 'Desserts', 'Beverages'];

const catIcon: Record<string, string> = {
  'North Indian': '🍛', 'South Indian': '🥘', 'Mughlai': '🍖',
  'Fast Food': '🍔', 'Chinese': '🍜', 'Desserts': '🍮', 'Beverages': '🧃',
};

const initialVendors: Vendor[] = [
  { id: 1, name: 'Spice Garden',    owner: 'Ramesh Yadav',  phone: '9876501234', area: 'Hazratganj',  category: 'North Indian', orders: 320, rating: 4.5, status: 'active',   joined: '2024-03-10' },
  { id: 2, name: 'Biryani Hub',     owner: 'Khalid Ahmed',  phone: '9823456700', area: 'Gomti Nagar', category: 'Mughlai',      orders: 280, rating: 4.7, status: 'active',   joined: '2024-04-22' },
  { id: 3, name: 'Pizza Palace',    owner: 'Anita Sharma',  phone: '9745670012', area: 'Aliganj',     category: 'Fast Food',    orders: 210, rating: 4.2, status: 'active',   joined: '2024-05-01' },
  { id: 4, name: 'Tandoor Express', owner: 'Sanjay Tiwari', phone: '9812345600', area: 'Indira Nagar',category: 'North Indian', orders: 175, rating: 4.0, status: 'inactive', joined: '2024-06-15' },
  { id: 5, name: 'Dosa Corner',     owner: 'Lakshmi Iyer',  phone: '9867890000', area: 'Aliganj',     category: 'South Indian', orders: 140, rating: 4.6, status: 'active',   joined: '2024-07-08' },
  { id: 6, name: 'Burger Junction', owner: 'Nitin Gupta',   phone: '9934567800', area: 'Chowk',       category: 'Fast Food',    orders: 98,  rating: 3.8, status: 'pending',  joined: '2024-12-20' },
];

const emptyForm = {
  name: '', owner: '', phone: '',
  area: areas[0], category: categories[0],
  status: 'active' as Status,
};

/* ─── Sub-components ─────────────────────────────────────────── */
const StarRating = ({ rating }: { rating: number }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
    <span style={{ color: '#f5a623', fontSize: 12 }}>
      {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
    </span>
    <span style={{ color: '#aaa', fontSize: 11 }}>{rating}</span>
  </span>
);

const Badge = ({ status }: { status: Status }) => {
  const cfg: Record<Status, { label: string; bg: string; color: string }> = {
    active:   { label: 'Active',   bg: '#e6f9ee', color: '#27ae60' },
    inactive: { label: 'Inactive', bg: '#fde8e8', color: '#e74c3c' },
    pending:  { label: 'Pending',  bg: '#fff8e1', color: '#f39c12' },
  };
  const { label, bg, color } = cfg[status];
  return (
    <span style={{
      background: bg, color, fontSize: 11, fontWeight: 700,
      padding: '3px 10px', borderRadius: 20, display: 'inline-block',
    }}>{label}</span>
  );
};

/* ─── Inline styles (avoids external CSS dependency) ─────────── */
const S = {
  /* layout */
  page: { padding: '16px', fontFamily: "'DM Sans', sans-serif", color: '#1a1a1a', fontSize: 14, background: '#f5f5f0', minHeight: '100vh' } as React.CSSProperties,
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' as const, gap: 10 },
  h1: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: '#888', marginTop: 3 },

  /* buttons */
  btnPrimary: { background: '#ff6b35', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 } as React.CSSProperties,
  btnGhost: { background: 'transparent', border: '1.5px solid #ddd', padding: '9px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#444' } as React.CSSProperties,

  /* filter bar */
  filterBar: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' as const, alignItems: 'center' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: 10, padding: '8px 12px', flex: 1, minWidth: 0 } as React.CSSProperties,
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent' } as React.CSSProperties,
  select: { border: '1.5px solid #e8e8e8', borderRadius: 10, padding: '8px 10px', fontSize: 13, background: '#fff', outline: 'none', cursor: 'pointer', color: '#333' } as React.CSSProperties,

  /* stats row */
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 },
  statCard: { background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #eee', textAlign: 'center' as const },
  statNum: { fontSize: 22, fontWeight: 800, letterSpacing: -1 },
  statLabel: { fontSize: 11, color: '#aaa', marginTop: 2, fontWeight: 600 },

  /* card / table */
  card: { background: '#fff', borderRadius: 14, border: '1px solid #e8e8e8', overflow: 'hidden' } as React.CSSProperties,
  tableWrap: { overflowX: 'auto' as const, width: '100%', WebkitOverflowScrolling: 'touch' as const } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, minWidth: 720 },
  th: { padding: '11px 14px', textAlign: 'left' as const, fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase' as const, letterSpacing: 0.6, background: '#fafafa', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' as const },
  td: { padding: '13px 14px', borderBottom: '1px solid #f2f2f2', verticalAlign: 'middle' as const, whiteSpace: 'nowrap' as const },
  tdLast: { padding: '13px 14px', verticalAlign: 'middle' as const, whiteSpace: 'nowrap' as const },

  /* vendor cell */
  vendorCell: { display: 'flex', alignItems: 'center', gap: 10 },
  vendorIcon: { width: 38, height: 38, background: '#fff3ec', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 } as React.CSSProperties,
  vendorName: { fontWeight: 700, fontSize: 13 },
  vendorPhone: { fontSize: 11, color: '#bbb', marginTop: 2 },

  /* tags */
  areaTag: { background: '#eef4ff', color: '#3d7aed', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 } as React.CSSProperties,
  catTag: { background: '#f5f5f5', color: '#666', fontSize: 11, padding: '3px 9px', borderRadius: 20 } as React.CSSProperties,

  /* action buttons */
  actions: { display: 'flex', gap: 5, alignItems: 'center' },
  actionBtn: { border: 'none', background: 'transparent', cursor: 'pointer', padding: '5px 7px', borderRadius: 7, fontSize: 14, lineHeight: 1 } as React.CSSProperties,
  toggleActive: { border: 'none', padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 700, background: '#fde8e8', color: '#e74c3c' } as React.CSSProperties,
  toggleInactive: { border: 'none', padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 700, background: '#e6f9ee', color: '#27ae60' } as React.CSSProperties,

  /* mobile cards */
  mobileList: { display: 'flex', flexDirection: 'column' as const, gap: 10 },
  mobileCard: { background: '#fff', borderRadius: 14, border: '1px solid #eee', padding: '14px 14px 12px', display: 'flex', flexDirection: 'column' as const, gap: 10 } as React.CSSProperties,
  mobileCardTop: { display: 'flex', alignItems: 'center', gap: 10 },
  mobileCardMeta: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 12 },
  metaLabel: { color: '#aaa', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.4 },
  metaValue: { fontWeight: 600, fontSize: 12, marginTop: 1 },
  mobileCardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #f2f2f2' },

  /* modal */
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, padding: 0 },
  modal: { background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, maxHeight: '92vh', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' } as React.CSSProperties,
  modalHandle: { width: 36, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '12px auto 0' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px 12px', borderBottom: '1px solid #eee', flexShrink: 0 },
  modalTitle: { fontSize: 17, fontWeight: 800 },
  modalClose: { border: 'none', background: '#f2f2f2', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties,
  modalBody: { padding: '16px 20px', overflowY: 'auto' as const, flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 14 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  formGroup: { display: 'flex', flexDirection: 'column' as const, gap: 5 },
  label: { fontSize: 12, fontWeight: 700, color: '#555' },
  input: { border: '1.5px solid #e8e8e8', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', width: '100%', background: '#fafafa', boxSizing: 'border-box' as const } as React.CSSProperties,
  formSelect: { border: '1.5px solid #e8e8e8', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', width: '100%', background: '#fafafa', color: '#333' } as React.CSSProperties,
  modalFooter: { display: 'flex', gap: 10, padding: '14px 20px', borderTop: '1px solid #eee', flexShrink: 0 },
  empty: { textAlign: 'center' as const, padding: '36px 20px', color: '#ccc', fontSize: 14 },
};

/* ─── Main Component ─────────────────────────────────────────── */
const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState(emptyForm);
  /* true on narrow screens — toggled by window width  */
  const [isMobile] = useState(() => window.innerWidth < 700);

  /* ── Derived ── */
  const filtered = vendors.filter(v => {
    const q = search.toLowerCase();
    const ms = v.name.toLowerCase().includes(q) || v.owner.toLowerCase().includes(q);
    const ma = areaFilter === 'all' || v.area === areaFilter;
    const mst = statusFilter === 'all' || v.status === statusFilter;
    return ms && ma && mst;
  });

  const activeCount   = vendors.filter(v => v.status === 'active').length;
  const inactiveCount = vendors.filter(v => v.status === 'inactive').length;
  const pendingCount  = vendors.filter(v => v.status === 'pending').length;

  /* ── Handlers ── */
  const openAdd = () => {
    setEditingVendor(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (v: Vendor) => {
    setEditingVendor(v);
    setForm({ name: v.name, owner: v.owner, phone: v.phone, area: v.area, category: v.category, status: v.status });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.owner.trim()) return;
    if (editingVendor) {
      setVendors(vendors.map(v => v.id === editingVendor.id ? { ...v, ...form } : v));
    } else {
      setVendors([...vendors, {
        id: Date.now(), ...form, orders: 0, rating: 0,
        joined: new Date().toISOString().split('T')[0],
      }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Kya aap is vendor ko delete karna chahte hain?'))
      setVendors(vendors.filter(v => v.id !== id));
  };

  const toggleStatus = (id: number) => {
    setVendors(vendors.map(v =>
      v.id === id ? { ...v, status: v.status === 'active' ? 'inactive' : 'active' } : v
    ));
  };

  /* ── Render ── */
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Vendors</h1>
          <p style={S.subtitle}>{activeCount} active vendors across {areas.length} areas</p>
        </div>
        <button style={S.btnPrimary} onClick={openAdd}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Vendor
        </button>
      </div>

      {/* Stats */}
      <div style={S.statsRow}>
        <div style={S.statCard}>
          <div style={{ ...S.statNum, color: '#27ae60' }}>{activeCount}</div>
          <div style={S.statLabel}>Active</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statNum, color: '#e74c3c' }}>{inactiveCount}</div>
          <div style={S.statLabel}>Inactive</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statNum, color: '#f39c12' }}>{pendingCount}</div>
          <div style={S.statLabel}>Pending</div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={S.filterBar}>
        <div style={S.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            style={S.searchInput}
            placeholder="Search vendors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select style={S.select} value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
          <option value="all">All Areas</option>
          {areas.map(a => <option key={a}>{a}</option>)}
        </select>
        <select style={S.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* ── Mobile Card List ── */}
      {isMobile ? (
        <div style={S.mobileList}>
          {filtered.length === 0 && (
            <div style={{ ...S.card, ...S.empty }}>Koi vendor nahi mila 🔍</div>
          )}
          {filtered.map(v => (
            <div key={v.id} style={S.mobileCard}>
              <div style={S.mobileCardTop}>
                <div style={S.vendorIcon}>{catIcon[v.category] ?? '🍽️'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.vendorName}>{v.name}</div>
                  <div style={S.vendorPhone}>{v.phone}</div>
                </div>
                <Badge status={v.status} />
              </div>

              <div style={S.mobileCardMeta}>
                <div>
                  <div style={S.metaLabel}>Owner</div>
                  <div style={S.metaValue}>{v.owner}</div>
                </div>
                <div>
                  <div style={S.metaLabel}>Area</div>
                  <div style={{ marginTop: 2 }}><span style={S.areaTag}>{v.area}</span></div>
                </div>
                <div>
                  <div style={S.metaLabel}>Category</div>
                  <div style={{ marginTop: 2 }}><span style={S.catTag}>{v.category}</span></div>
                </div>
                <div>
                  <div style={S.metaLabel}>Orders</div>
                  <div style={{ ...S.metaValue, fontSize: 15 }}>{v.orders}</div>
                </div>
                <div>
                  <div style={S.metaLabel}>Rating</div>
                  <div style={{ marginTop: 2 }}><StarRating rating={v.rating} /></div>
                </div>
                <div>
                  <div style={S.metaLabel}>Joined</div>
                  <div style={S.metaValue}>{v.joined}</div>
                </div>
              </div>

              <div style={S.mobileCardFooter}>
                <div style={S.actions}>
                  <button
                    style={v.status === 'active' ? S.toggleActive : S.toggleInactive}
                    onClick={() => toggleStatus(v.id)}
                  >
                    {v.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
                <div style={S.actions}>
                  <button style={S.actionBtn} onClick={() => openEdit(v)} title="Edit">✏️</button>
                  <button style={S.actionBtn} onClick={() => handleDelete(v.id)} title="Delete">🗑️</button>
                </div>
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
                  {['Vendor','Owner','Area','Category','Orders','Rating','Status','Joined','Actions'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={S.empty}>Koi vendor nahi mila 🔍</td></tr>
                )}
                {filtered.map((v, i) => (
                  <tr key={v.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={S.td}>
                      <div style={S.vendorCell}>
                        <div style={S.vendorIcon}>{catIcon[v.category] ?? '🍽️'}</div>
                        <div>
                          <div style={S.vendorName}>{v.name}</div>
                          <div style={S.vendorPhone}>{v.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={S.td}>{v.owner}</td>
                    <td style={S.td}><span style={S.areaTag}>{v.area}</span></td>
                    <td style={S.td}><span style={S.catTag}>{v.category}</span></td>
                    <td style={S.td}><strong>{v.orders}</strong></td>
                    <td style={S.td}><StarRating rating={v.rating} /></td>
                    <td style={S.td}><Badge status={v.status} /></td>
                    <td style={S.td}>{v.joined}</td>
                    <td style={S.tdLast}>
                      <div style={S.actions}>
                        <button style={S.actionBtn} onClick={() => openEdit(v)} title="Edit">✏️</button>
                        <button
                          style={v.status === 'active' ? S.toggleActive : S.toggleInactive}
                          onClick={() => toggleStatus(v.id)}
                        >
                          {v.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button style={S.actionBtn} onClick={() => handleDelete(v.id)} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal (bottom sheet on mobile) ── */}
      {showModal && (
        <div style={S.overlay} onClick={() => setShowModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHandle} />
            <div style={S.modalHeader}>
              <span style={S.modalTitle}>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</span>
              <button style={S.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={S.modalBody}>
              {/* Row 1 */}
              <div style={S.twoCol}>
                <div style={S.formGroup}>
                  <label style={S.label}>Restaurant Name *</label>
                  <input
                    style={S.input}
                    placeholder="e.g. Spice Garden"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Owner Name *</label>
                  <input
                    style={S.input}
                    placeholder="Full name"
                    value={form.owner}
                    onChange={e => setForm({ ...form, owner: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div style={S.formGroup}>
                <label style={S.label}>Phone Number *</label>
                <input
                  style={S.input}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              {/* Row 3 */}
              <div style={S.twoCol}>
                <div style={S.formGroup}>
                  <label style={S.label}>Service Area *</label>
                  <select
                    style={S.formSelect}
                    value={form.area}
                    onChange={e => setForm({ ...form, area: e.target.value })}
                  >
                    {areas.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Food Category *</label>
                  <select
                    style={S.formSelect}
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4 */}
              <div style={S.formGroup}>
                <label style={S.label}>Status</label>
                <select
                  style={S.formSelect}
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as Status })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending Review</option>
                </select>
              </div>
            </div>

            <div style={S.modalFooter}>
              <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                style={{ ...S.btnPrimary, flex: 2, justifyContent: 'center', opacity: (!form.name || !form.owner) ? 0.5 : 1 }}
                onClick={handleSave}
                disabled={!form.name || !form.owner}
              >
                {editingVendor ? 'Save Changes' : 'Add Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;