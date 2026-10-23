import React, { useState } from 'react';

/* ─── Types ─────────────────────────────────────────────────── */
type AreaStatus = 'active' | 'inactive';

interface Area {
  id: number;
  name: string;
  city: string;
  vendors: number;
  orders: number;
  deliveryFee: number;
  status: AreaStatus;
  pincode: string;
}

/* ─── Static data ────────────────────────────────────────────── */
const initialAreas: Area[] = [
  { id: 1, name: 'Hazratganj',  city: 'Lucknow', vendors: 12, orders: 320, deliveryFee: 20, status: 'active',   pincode: '226001' },
  { id: 2, name: 'Gomti Nagar', city: 'Lucknow', vendors: 10, orders: 280, deliveryFee: 25, status: 'active',   pincode: '226010' },
  { id: 3, name: 'Aliganj',     city: 'Lucknow', vendors: 8,  orders: 210, deliveryFee: 30, status: 'active',   pincode: '226024' },
  { id: 4, name: 'Indira Nagar',city: 'Lucknow', vendors: 7,  orders: 175, deliveryFee: 35, status: 'active',   pincode: '226016' },
  { id: 5, name: 'Chowk',       city: 'Lucknow', vendors: 5,  orders: 120, deliveryFee: 20, status: 'active',   pincode: '226003' },
  { id: 6, name: 'Rajajipuram', city: 'Lucknow', vendors: 3,  orders: 60,  deliveryFee: 40, status: 'inactive', pincode: '226017' },
];

const emptyForm = { name: '', city: 'Lucknow', pincode: '', deliveryFee: 20, status: 'active' as AreaStatus };

/* ─── Palette ────────────────────────────────────────────────── */
const C = {
  accent:   '#ff6b35',
  green:    '#27ae60',
  greenDim: '#e6f9ee',
  red:      '#e74c3c',
  redDim:   '#fde8e8',
  blue:     '#3d7aed',
  blueDim:  '#eef4ff',
  bg:       '#f5f5f0',
  card:     '#fff',
  border:   '#e8e8e8',
  muted:    '#aaa',
  text:     '#1a1a1a',
  elevated: '#f9f9f9',
};

/* ─── Styles ─────────────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  page:       { padding: 16, fontFamily: "'DM Sans', sans-serif", color: C.text, fontSize: 14, background: C.bg, minHeight: '100vh' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
  h1:         { fontSize: 22, fontWeight: 800, letterSpacing: -0.5 },
  subtitle:   { fontSize: 12, color: C.muted, marginTop: 3 },

  btnPrimary: { background: C.accent, color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 },
  btnGhost:   { background: 'transparent', border: `1.5px solid ${C.border}`, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#444', flex: 1, textAlign: 'center' as const },
  btnDanger:  { background: C.redDim, border: 'none', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 14, color: C.red, flexShrink: 0 },

  /* summary stats */
  statsRow:   { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 },
  statCard:   { background: C.card, borderRadius: 12, padding: '14px 10px', border: `1px solid ${C.border}`, textAlign: 'center' },
  statEmoji:  { fontSize: 24, marginBottom: 4 },
  statNum:    { fontSize: 24, fontWeight: 800, letterSpacing: -1 },
  statLabel:  { fontSize: 10, color: C.muted, marginTop: 3, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5 },

  /* search */
  filterBar:   { display: 'flex', gap: 8, marginBottom: 14 },
  searchBox:   { display: 'flex', alignItems: 'center', gap: 8, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', flex: 1 },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent' },

  /* area cards grid */
  grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 },

  /* single area card */
  areaCard:   { background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 16, position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 },
  cardTop:    { display: 'flex', alignItems: 'center', gap: 12 },
  iconBox:    { width: 44, height: 44, borderRadius: 10, background: C.blueDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  areaName:   { fontSize: 16, fontWeight: 800, letterSpacing: -0.3 },
  areaSub:    { fontSize: 12, color: C.muted, marginTop: 2 },
  statusDot:  { position: 'absolute', top: 16, right: 16, width: 9, height: 9, borderRadius: '50%' },

  metaGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  metaBox:    { background: C.elevated, borderRadius: 9, padding: '10px 12px' },
  metaLabel:  { fontSize: 10, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: 0.7, fontWeight: 700, marginBottom: 3 },
  metaValue:  { fontSize: 20, fontWeight: 800 },

  feeRow:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  feeTxt:     { fontSize: 13, color: '#666' },
  feeAmt:     { color: C.accent, fontWeight: 700 },
  badge:      { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block' },

  barTrack:   { height: 5, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: 3, background: C.accent, transition: 'width .4s' },
  barLabel:   { fontSize: 11, color: C.muted, marginBottom: 5 },

  cardActions: { display: 'flex', gap: 8, marginTop: 2 },

  /* modal */
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 },
  modal:       { background: C.card, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' },
  modalHandle: { width: 36, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '12px auto 0' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px 12px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 },
  modalTitle:  { fontSize: 17, fontWeight: 800 },
  modalClose:  { border: 'none', background: '#f2f2f2', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody:   { padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 },
  twoCol:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  formGroup:   { display: 'flex', flexDirection: 'column', gap: 5 },
  fLabel:      { fontSize: 12, fontWeight: 700, color: '#555' },
  fInput:      { border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', width: '100%', background: '#fafafa', boxSizing: 'border-box' as const },
  fSelect:     { border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', width: '100%', background: '#fafafa', color: C.text },
  modalFooter: { display: 'flex', gap: 10, padding: '14px 20px', borderTop: `1px solid ${C.border}`, flexShrink: 0 },
  btnSave:     { background: C.accent, color: '#fff', border: 'none', padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, flex: 2 },
  btnCancel:   { background: 'transparent', border: `1.5px solid ${C.border}`, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#444', flex: 1 },

  empty: { textAlign: 'center', padding: '36px 20px', color: '#ccc', fontSize: 14, background: C.card, borderRadius: 14, border: `1px solid ${C.border}` },
};

/* ─── Main Component ─────────────────────────────────────────── */
const Areas: React.FC = () => {
  const [areas, setAreas]           = useState<Area[]>(initialAreas);
  const [showModal, setShowModal]   = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [search, setSearch]         = useState('');

  const filtered = areas.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.pincode.includes(search)
  );

  const totalOrders  = areas.reduce((s, a) => s + a.orders, 0);
  const totalVendors = areas.reduce((s, a) => s + a.vendors, 0);
  const activeCount  = areas.filter(a => a.status === 'active').length;

  const openAdd = () => { setEditingArea(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (a: Area) => {
    setEditingArea(a);
    setForm({ name: a.name, city: a.city, pincode: a.pincode, deliveryFee: a.deliveryFee, status: a.status });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.pincode.trim()) return;
    if (editingArea) {
      setAreas(areas.map(a => a.id === editingArea.id ? { ...a, ...form } : a));
    } else {
      setAreas([...areas, { id: Date.now(), ...form, vendors: 0, orders: 0 }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Kya aap is area ko delete karna chahte hain?'))
      setAreas(areas.filter(a => a.id !== id));
  };

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Areas & Zones</h1>
          <p style={S.subtitle}>{activeCount} active delivery areas configured</p>
        </div>
        <button style={S.btnPrimary} onClick={openAdd}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Area
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div style={S.statsRow}>
        <div style={S.statCard}>
          <div style={S.statEmoji}>📍</div>
          <div style={{ ...S.statNum, color: C.accent }}>{areas.length}</div>
          <div style={S.statLabel}>Total Areas</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statEmoji}>🏪</div>
          <div style={{ ...S.statNum, color: C.green }}>{totalVendors}</div>
          <div style={S.statLabel}>Vendors</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statEmoji}>📦</div>
          <div style={{ ...S.statNum, color: C.blue }}>{totalOrders}</div>
          <div style={S.statLabel}>Orders</div>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={S.filterBar}>
        <div style={S.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            style={S.searchInput}
            placeholder="Search areas or pincode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Area Cards Grid ── */}
      {filtered.length === 0 ? (
        <div style={S.empty}>Koi area nahi mila 🔍</div>
      ) : (
        <div style={S.grid}>
          {filtered.map(area => {
            const pct = totalOrders > 0 ? Math.round((area.orders / totalOrders) * 100) : 0;
            const isActive = area.status === 'active';
            return (
              <div key={area.id} style={S.areaCard}>

                {/* Status dot */}
                <div style={{
                  ...S.statusDot,
                  background: isActive ? C.green : C.red,
                  boxShadow: `0 0 0 3px ${isActive ? C.greenDim : C.redDim}`,
                }} />

                {/* Card top */}
                <div style={S.cardTop}>
                  <div style={S.iconBox}>📍</div>
                  <div>
                    <div style={S.areaName}>{area.name}</div>
                    <div style={S.areaSub}>{area.city} — {area.pincode}</div>
                  </div>
                </div>

                {/* Vendors / Orders */}
                <div style={S.metaGrid}>
                  <div style={S.metaBox}>
                    <div style={S.metaLabel}>Vendors</div>
                    <div style={{ ...S.metaValue, color: C.green }}>{area.vendors}</div>
                  </div>
                  <div style={S.metaBox}>
                    <div style={S.metaLabel}>Orders</div>
                    <div style={{ ...S.metaValue, color: C.blue }}>{area.orders}</div>
                  </div>
                </div>

                {/* Fee + badge */}
                <div style={S.feeRow}>
                  <div style={S.feeTxt}>
                    Delivery Fee: <span style={S.feeAmt}>₹{area.deliveryFee}</span>
                  </div>
                  <span style={{
                    ...S.badge,
                    background: isActive ? C.greenDim : C.redDim,
                    color: isActive ? C.green : C.red,
                  }}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={S.barLabel}>Share of total orders ({pct}%)</div>
                  <div style={S.barTrack}>
                    <div style={{ ...S.barFill, width: `${pct}%` }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={S.cardActions}>
                  <button style={S.btnGhost} onClick={() => openEdit(area)}>✏️ Edit</button>
                  <button style={S.btnDanger} onClick={() => handleDelete(area.id)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Modal (bottom sheet) ── */}
      {showModal && (
        <div style={S.overlay} onClick={() => setShowModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHandle} />

            <div style={S.modalHeader}>
              <span style={S.modalTitle}>{editingArea ? 'Edit Area' : 'Add New Area'}</span>
              <button style={S.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={S.modalBody}>
              {/* Row 1 */}
              <div style={S.twoCol}>
                <div style={S.formGroup}>
                  <label style={S.fLabel}>Area Name *</label>
                  <input
                    style={S.fInput}
                    placeholder="e.g. Hazratganj"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div style={S.formGroup}>
                  <label style={S.fLabel}>City *</label>
                  <input
                    style={S.fInput}
                    placeholder="e.g. Lucknow"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div style={S.twoCol}>
                <div style={S.formGroup}>
                  <label style={S.fLabel}>Pincode *</label>
                  <input
                    style={S.fInput}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    value={form.pincode}
                    onChange={e => setForm({ ...form, pincode: e.target.value })}
                  />
                </div>
                <div style={S.formGroup}>
                  <label style={S.fLabel}>Delivery Fee (₹) *</label>
                  <input
                    style={S.fInput}
                    type="number"
                    min={0}
                    placeholder="e.g. 30"
                    value={form.deliveryFee}
                    onChange={e => setForm({ ...form, deliveryFee: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div style={S.formGroup}>
                <label style={S.fLabel}>Status</label>
                <select
                  style={S.fSelect}
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as AreaStatus })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div style={S.modalFooter}>
              <button style={S.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
              <button
                style={{ ...S.btnSave, opacity: (!form.name || !form.pincode) ? 0.5 : 1 }}
                onClick={handleSave}
                disabled={!form.name || !form.pincode}
              >
                {editingArea ? 'Save Changes' : 'Add Area'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Areas;