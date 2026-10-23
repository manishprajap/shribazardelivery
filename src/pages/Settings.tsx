import React, { useState } from 'react';

/* ─── Types ─────────────────────────────────────────────────── */
interface SettingsState {
  appName: string;
  supportPhone: string;
  supportEmail: string;
  currency: string;
  orderNotifications: boolean;
  vendorAlerts: boolean;
  dailyReport: boolean;
  autoAssign: boolean;
  maintenanceMode: boolean;
  minOrderAmount: number;
  maxDeliveryRadius: number;
  platformFee: number;
}

/* ─── Palette ────────────────────────────────────────────────── */
const C = {
  accent: '#ff6b35', green: '#27ae60', greenDim: '#e6f9ee',
  red: '#e74c3c', redDim: '#fde8e8', blue: '#3d7aed',
  bg: '#f5f5f0', card: '#fff', border: '#e8e8e8', muted: '#aaa', text: '#1a1a1a',
};

/* ─── Styles ─────────────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  page:        { padding: 16, fontFamily: "'DM Sans', sans-serif", color: C.text, fontSize: 14, background: C.bg, minHeight: '100vh' },
  pageHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
  h1:          { fontSize: 22, fontWeight: 800, letterSpacing: -0.5 },
  subtitle:    { fontSize: 12, color: C.muted, marginTop: 3 },
  btnPrimary:  { background: C.accent, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 },

  /* layout: stacked on mobile, side-by-side on wide screens */
  twoCol:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, alignItems: 'start' },

  /* card */
  card:        { background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' },
  cardInner:   { display: 'flex', flexDirection: 'column' as const, gap: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 800, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: 0.8, padding: '14px 16px 0' },

  /* settings rows */
  settingsSection: { display: 'flex', flexDirection: 'column' as const },
  settingsRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px', borderBottom: `1px solid #f5f5f5` },
  settingsRowLast: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px' },
  rowInfo:      { flex: 1, minWidth: 0 },
  rowTitle:     { fontSize: 13, fontWeight: 700, color: C.text },
  rowDesc:      { fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.4 },

  /* inputs */
  textInput:    { background: '#f9f9f9', border: `1.5px solid ${C.border}`, borderRadius: 9, padding: '8px 11px', fontSize: 13, color: C.text, outline: 'none', width: 160, flexShrink: 0 },
  numInput:     { background: '#f9f9f9', border: `1.5px solid ${C.border}`, borderRadius: 9, padding: '8px 11px', fontSize: 13, color: C.text, outline: 'none', width: 90, flexShrink: 0, textAlign: 'right' as const },

  /* toggle switch */
  toggleWrap:   { position: 'relative', flexShrink: 0 },
  toggleInput:  { opacity: 0, width: 0, height: 0, position: 'absolute' },

  /* danger zone */
  dangerCard:   { background: C.card, borderRadius: 14, border: `1.5px solid rgba(231,76,60,0.25)`, overflow: 'hidden' },
  dangerTitle:  { fontSize: 12, fontWeight: 800, color: C.red, textTransform: 'uppercase' as const, letterSpacing: 0.8, padding: '14px 16px 0' },
  dangerRow:    { padding: '13px 16px', borderBottom: `1px solid #f5f5f5` },
  dangerRowLast:{ padding: '13px 16px' },
  dangerLabel:  { fontSize: 13, fontWeight: 700, marginBottom: 3 },
  dangerDesc:   { fontSize: 11, color: C.muted, marginBottom: 10 },
  btnDanger:    { background: C.redDim, color: C.red, border: 'none', padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700 },

  empty: { textAlign: 'center' as const, padding: 20, color: C.muted },
};

/* ─── Toggle Switch Component ───────────────────────────────── */
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <div
    onClick={onChange}
    style={{
      width: 44, height: 24, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
      background: checked ? C.green : '#ddd',
      position: 'relative', transition: 'background .2s',
    }}
  >
    <div style={{
      position: 'absolute', top: 3, left: checked ? 23 : 3,
      width: 18, height: 18, borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left .2s',
    }} />
  </div>
);

/* ─── Reusable Row Components ───────────────────────────────── */
const TextRow = ({ title, desc, value, onChange, isLast = false }: { title: string; desc: string; value: string; onChange: (v: string) => void; isLast?: boolean }) => (
  <div style={isLast ? S.settingsRowLast : S.settingsRow}>
    <div style={S.rowInfo}>
      <div style={S.rowTitle}>{title}</div>
      <div style={S.rowDesc}>{desc}</div>
    </div>
    <input style={S.textInput} value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const NumRow = ({ title, desc, value, onChange, min = 0, max = 999, isLast = false }: { title: string; desc: string; value: number; onChange: (v: number) => void; min?: number; max?: number; isLast?: boolean }) => (
  <div style={isLast ? S.settingsRowLast : S.settingsRow}>
    <div style={S.rowInfo}>
      <div style={S.rowTitle}>{title}</div>
      <div style={S.rowDesc}>{desc}</div>
    </div>
    <input style={S.numInput} type="number" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} />
  </div>
);

const ToggleRow = ({ title, desc, checked, onChange, isLast = false }: { title: string; desc: string; checked: boolean; onChange: () => void; isLast?: boolean }) => (
  <div style={isLast ? S.settingsRowLast : S.settingsRow}>
    <div style={S.rowInfo}>
      <div style={S.rowTitle}>{title}</div>
      <div style={S.rowDesc}>{desc}</div>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

/* ─── Main Component ─────────────────────────────────────────── */
const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    appName: 'Shri Bazar',
    supportPhone: '+91-7652015481',
    supportEmail: 'shrient.99@gmail.com',
    currency: '₹',
    orderNotifications: true,
    vendorAlerts: true,
    dailyReport: false,
    autoAssign: true,
    maintenanceMode: false,
    minOrderAmount: 50,
    maxDeliveryRadius: 10,
    platformFee: 5,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof SettingsState) =>
    setSettings(s => ({ ...s, [key]: !s[key] }));

  const update = (key: keyof SettingsState, value: string | number) =>
    setSettings(s => ({ ...s, [key]: value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Sab settings reset karna chahte hain?')) {
      setSettings({
        appName: 'Shri Bazar', supportPhone: '+91-7652015481', supportEmail: 'shrient.99@gmail.com',
        currency: '₹', orderNotifications: true, vendorAlerts: true, dailyReport: false,
        autoAssign: true, maintenanceMode: false, minOrderAmount: 50, maxDeliveryRadius: 10, platformFee: 5,
      });
    }
  };

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Settings</h1>
          <p style={S.subtitle}>Configure your food delivery platform</p>
        </div>
        <button
          style={{ ...S.btnPrimary, background: saved ? C.green : C.accent, transition: 'background .3s' }}
          onClick={handleSave}
        >
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      <div style={S.twoCol}>

        {/* ── Left Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* General */}
          <div style={S.card}>
            <div style={S.sectionTitle}>⚙️ General</div>
            <div style={{ ...S.settingsSection, marginTop: 8 }}>
              <TextRow title="App Name"       desc="Display name for the platform"     value={settings.appName}       onChange={v => update('appName', v)} />
              <TextRow title="Support Phone"  desc="Customer support contact"          value={settings.supportPhone}  onChange={v => update('supportPhone', v)} />
              <TextRow title="Support Email"  desc="Help desk email address"           value={settings.supportEmail}  onChange={v => update('supportEmail', v)} />
              <NumRow  title="Platform Fee (%)"     desc="Commission charged to vendors"    value={settings.platformFee}   onChange={v => update('platformFee', v)}   min={0} max={50} />
              <NumRow  title="Min Order Amount (₹)" desc="Minimum cart value to place order" value={settings.minOrderAmount} onChange={v => update('minOrderAmount', v)} min={0} isLast />
            </div>
          </div>

          {/* Notifications */}
          <div style={S.card}>
            <div style={S.sectionTitle}>🔔 Notifications</div>
            <div style={{ ...S.settingsSection, marginTop: 8 }}>
              <ToggleRow title="New Order Alerts"   desc="Notify admin when a new order is placed"        checked={settings.orderNotifications} onChange={() => toggle('orderNotifications')} />
              <ToggleRow title="Vendor Alerts"      desc="Alerts when a vendor registers or updates"      checked={settings.vendorAlerts}        onChange={() => toggle('vendorAlerts')} />
              <ToggleRow title="Daily Report Email" desc="Send daily summary to support email"            checked={settings.dailyReport}         onChange={() => toggle('dailyReport')} isLast />
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Operations */}
          <div style={S.card}>
            <div style={S.sectionTitle}>🚀 Operations</div>
            <div style={{ ...S.settingsSection, marginTop: 8 }}>
              <ToggleRow title="Auto-assign Vendors" desc="Automatically assign orders to nearest vendor"    checked={settings.autoAssign}       onChange={() => toggle('autoAssign')} />
              <ToggleRow
                title="Maintenance Mode"
                desc="Pause all new orders (emergency use only)"
                checked={settings.maintenanceMode}
                onChange={() => toggle('maintenanceMode')}
              />
              <NumRow title="Max Delivery Radius (km)" desc="Maximum delivery distance from vendor" value={settings.maxDeliveryRadius} onChange={v => update('maxDeliveryRadius', v)} min={1} max={50} isLast />
            </div>
          </div>

          {/* Maintenance Mode Banner */}
          {settings.maintenanceMode && (
            <div style={{ background: '#fff8e1', border: '1.5px solid #f39c12', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: '#e67e22', fontSize: 13 }}>Maintenance Mode ON</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Naye orders band hain. Jab kaam ho jaye tab disable karein.</div>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div style={S.dangerCard}>
            <div style={S.dangerTitle}>⚠ Danger Zone</div>
            <div style={{ marginTop: 8 }}>
              <div style={S.dangerRow}>
                <div style={S.dangerLabel}>Reset All Settings</div>
                <div style={S.dangerDesc}>Restore all settings to their defaults</div>
                <button style={S.btnDanger} onClick={handleReset}>Reset Settings</button>
              </div>
              <div style={S.dangerRowLast}>
                <div style={S.dangerLabel}>Clear All Orders</div>
                <div style={S.dangerDesc}>Permanently delete all order history</div>
                <button
                  style={S.btnDanger}
                  onClick={() => window.confirm('Kya aap sab orders delete karna chahte hain? Yeh wapas nahi aayenge!') && alert('Orders cleared!')}
                >
                  Clear Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;