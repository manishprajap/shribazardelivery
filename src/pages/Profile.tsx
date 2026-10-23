import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage,
  IonContent,
  IonAlert,
  IonSpinner,
  IonRippleEffect,
} from '@ionic/react';
import { apiGet, apiPost } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliveryProfile {
  id?: number | string;
  delivery_boy_id?: string;
  name?: string;
  user_name?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  vehicle?: string;
  vehicle_type?: string;
  zone?: string;
  area?: string;
  rating?: number | string;
  total_deliveries?: number | string;
  today_deliveries?: number | string;
  km_today?: number | string;
  joined_date?: string;
  created_at?: string;
  avatar?: string;
  profile_image?: string;
  address?: string;
  acceptance_rate?: number;
  ontime_rate?: number;
  completion_rate?: number;
}

interface DeliveryOrder {
  id: number | string;
  status?: string;
  delivery_status?: string;
  delivered_at?: string;
  created_at?: string;
  km?: number | string;
  distance?: number | string;
}

interface ProfileProps {
  onLogout?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safe = (val: string | number | undefined | null, fallback = '—') =>
  val !== undefined && val !== null && String(val).trim() !== ''
    ? String(val)
    : fallback;

const initials = (name?: string) =>
  (name || 'DP').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const isToday = (dateStr?: string) => {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  } catch { return false; }
};

const isDelivered = (o: DeliveryOrder) =>
  (o.status ?? o.delivery_status ?? '').toLowerCase().includes('deliver');

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const PhoneIcon: React.FC<{ color?: string }> = ({ color = '#10B981' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const EmailIcon: React.FC<{ color?: string }> = ({ color = '#3B82F6' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const CalendarIcon: React.FC<{ color?: string }> = ({ color = '#8B5CF6' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const LocationIcon: React.FC<{ color?: string }> = ({ color = '#EC4899' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const LogoutIcon: React.FC<{ color?: string }> = ({ color = '#EF4444' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ChevronIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const StarIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      width: 50, height: 28, borderRadius: 99, flexShrink: 0, cursor: 'pointer',
      background: checked ? '#0F4C35' : '#E2E8F0',
      position: 'relative', transition: 'background .25s',
    }}
  >
    <div style={{
      position: 'absolute', width: 22, height: 22, borderRadius: '50%', background: '#fff',
      top: 3, left: checked ? 25 : 3, transition: 'left .25s',
      boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
    }} />
  </div>
);

const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; last?: boolean;
}> = ({ label, value, onChange, type = 'text', placeholder, last }) => (
  <div style={{ padding: '12px 16px', borderBottom: last ? 'none' : '1px solid #F8FAFC' }}>
    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</p>
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 10,
        padding: '10px 14px', fontSize: 14, color: '#1E293B',
        outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
      }}
    />
  </div>
);

const InfoRow: React.FC<{
  icon: React.ReactNode; iconBg: string; label: string; value: string; last?: boolean;
}> = ({ icon, iconBg, label, value, last }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px', borderBottom: last ? 'none' : '1px solid #F8FAFC',
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 12, background: iconBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 14, color: '#1E293B', fontWeight: 500 }}>{value}</p>
    </div>
  </div>
);

const ActionRow: React.FC<{
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; last?: boolean;
}> = ({ icon, label, onClick, danger, last }) => (
  <div
    className="ion-activatable"
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
      borderBottom: last ? 'none' : '1px solid #F8FAFC',
    }}
  >
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: danger ? '#FEF2F2' : '#F8FAFC',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {icon}
    </div>
    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: danger ? '#EF4444' : '#1E293B' }}>{label}</span>
    {!danger && <ChevronIcon />}
    <IonRippleEffect />
  </div>
);

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
    {children}
  </div>
);

const Sec: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ margin: '20px 16px 0' }}>
    {title && (
      <p style={{ margin: '0 0 10px 4px', fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase' }}>
        {title}
      </p>
    )}
    <Card>{children}</Card>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  const [profile, setProfile]             = useState<DeliveryProfile | null>(null);
  const [orders, setOrders]               = useState<DeliveryOrder[]>([]);
  const [loading, setLoading]             = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [editMode, setEditMode]           = useState(false);
  const [showLogout, setShowLogout]       = useState(false);
  const [toastMsg, setToastMsg]           = useState<{ msg: string; ok: boolean } | null>(null);

  const [acceptOrders,  setAcceptOrders]  = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [shareLocation, setShareLocation] = useState(true);

  const [editName,    setEditName]    = useState('');
  const [editPhone,   setEditPhone]   = useState('');
  const [editEmail,   setEditEmail]   = useState('');
  const [editAddress, setEditAddress] = useState('');

  const showToast = useCallback((msg: string, ok = true) => {
    setToastMsg({ msg, ok });
    setTimeout(() => setToastMsg(null), 2800);
  }, []);

  // ── Load Profile ──────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiGet('profile');
      const data: DeliveryProfile = res?.data ?? res;
      if (data && (data.name || data.user_name || data.id)) {
        setProfile(data);
      } else {
        setError(res?.message ?? 'Failed to load profile.');
      }
    } catch {
      setError('Network error. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load Orders → actual counts ───────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await apiGet('delivery/orders');
      const data: DeliveryOrder[] = res?.data ?? res ?? [];
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]); // silently fail
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadOrders();
  }, [loadProfile, loadOrders]);

  useEffect(() => {
    if (!profile) return;
    setEditName(profile.name ?? profile.user_name ?? '');
    setEditPhone(profile.phone ?? profile.mobile ?? '');
    setEditEmail(profile.email ?? '');
    setEditAddress(profile.address ?? '');
  }, [profile]);

  const handleSave = async () => {
    if (!editName.trim()) { showToast('Name is required', false); return; }
    const payload = {
      name: editName.trim(), phone: editPhone.trim(),
      email: editEmail.trim(), address: editAddress.trim(),
    };
    setSaving(true);
    try {
      const res = await apiPost('profile', payload);
      if (res?.success || res?.data || res?.name || res?.user_name) {
        setProfile(p => ({ ...p, ...payload }));
        setEditMode(false);
        showToast('Profile updated ✓');
      } else {
        showToast(res?.message ?? 'Update failed', false);
      }
    } catch {
      showToast('Network error', false);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    onLogout?.();
  };

  // ── Compute counts from /delivery/orders ──────────────────────────────────
  const deliveredOrders = orders.filter(isDelivered);

  // Today = delivered today
  const todayDelivered = deliveredOrders.filter(o =>
    isToday(o.delivered_at ?? o.created_at)
  );

  // Total km from orders (if each order has km/distance field)
  const totalKmFromOrders = orders.reduce((sum, o) => {
    const k = parseFloat(String(o.km ?? o.distance ?? 0));
    return sum + (isNaN(k) ? 0 : k);
  }, 0);

  // ── Final stat display values ─────────────────────────────────────────────
  //  orders API > profile field > 0
  const totalDeliveriesVal = (() => {
    if (ordersLoading) return '…';
    if (deliveredOrders.length > 0) return deliveredOrders.length.toLocaleString();
    const pv = Number(profile?.total_deliveries ?? 0);
    return pv > 0 ? pv.toLocaleString() : orders.length.toLocaleString();
  })();

  const todayDeliveriesVal = (() => {
    if (ordersLoading) return '…';
    if (todayDelivered.length > 0) return String(todayDelivered.length);
    const pv = Number(profile?.today_deliveries ?? 0);
    return String(pv);
  })();

  const kmVal = (() => {
    if (totalKmFromOrders > 0) return totalKmFromOrders.toFixed(1);
    const pv = parseFloat(safe(profile?.km_today, '0'));
    return pv > 0 ? pv.toFixed(1) : '0';
  })();

  // ── Other derived ─────────────────────────────────────────────────────────
  const name      = safe(profile?.name ?? profile?.user_name, 'Delivery rider');
  const phone     = safe(profile?.phone ?? profile?.mobile);
  const email     = safe(profile?.email);
  const zone      = safe(profile?.zone ?? profile?.area);
  const rating    = parseFloat(safe(profile?.rating, '0')) || 0;
  const joined    = safe(profile?.joined_date ?? profile?.created_at);
  const pid       = safe(profile?.delivery_boy_id ?? profile?.id);
  const avatarSrc = profile?.avatar ?? profile?.profile_image;

  // Performance — compute from orders if profile rates are 0
  const acceptanceRate = (() => {
    if (profile?.acceptance_rate && profile.acceptance_rate > 0) return profile.acceptance_rate;
    if (orders.length === 0) return 0;
    const accepted = orders.filter(o => {
      const s = (o.status ?? o.delivery_status ?? '').toLowerCase();
      return s !== '' && !s.includes('cancel');
    }).length;
    return Math.round((accepted / orders.length) * 100);
  })();

  const completionRate = (() => {
    if (profile?.completion_rate && profile.completion_rate > 0) return profile.completion_rate;
    if (orders.length === 0) return 0;
    return Math.round((deliveredOrders.length / orders.length) * 100);
  })();

  const perfs = [
    { label: 'Acceptance Rate', value: acceptanceRate,              color: '#10B981' },
    { label: 'On-time Rate',    value: profile?.ontime_rate ?? 0,  color: '#3B82F6' },
    { label: 'Completion Rate', value: completionRate,              color: '#10B981' },
  ];

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#F0F2F7' } as React.CSSProperties}>

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <div style={{
          background: 'linear-gradient(145deg, #0A3526 0%, #0F6B47 55%, #1aab6d 100%)',
          padding: '0 24px 72px', position: 'relative', overflow: 'hidden',
          minHeight: loading ? 220 : undefined,
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: 24, position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>Profile</span>
            {!loading && !error && (
              editMode ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => setEditMode(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 8px' }}>
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} style={{
                    background: saving ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.95)',
                    color: saving ? '#fff' : '#0A3526', border: 'none', padding: '7px 18px', borderRadius: 99,
                    fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                  }}>
                    {saving && <IonSpinner name="crescent" style={{ width: 13, height: 13 }} />}
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditMode(true)} style={{
                  background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.35)',
                  color: '#fff', padding: '7px 18px', borderRadius: 99, fontSize: 13,
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  ✏ Edit
                </button>
              )
            )}
          </div>

          {/* Avatar */}
          {!loading && !error && profile && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{ width: 90, height: 90, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.35)', padding: 3, marginBottom: 14, background: 'rgba(255,255,255,0.1)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff', overflow: 'hidden' }}>
                  {avatarSrc ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(name)}
                </div>
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{name}</h2>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>#{pid} · {zone}</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 99 }}>
                <StarIcon />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{rating > 0 ? rating.toFixed(1) : 'New'}</span>
                {rating > 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>/ 5.0</span>}
              </div>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20, position: 'relative', zIndex: 2 }}>
              <IonSpinner name="crescent" style={{ color: '#fff', width: 36, height: 36 }} />
              <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12, fontSize: 14 }}>Loading…</p>
            </div>
          )}
        </div>

        {/* ══ STATS CARD ════════════════════════════════════════════════════ */}
        {!loading && !error && profile && (
          <div style={{
            background: '#fff', borderRadius: 20, margin: '-40px 16px 0',
            padding: '18px 8px', display: 'flex', alignItems: 'stretch',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', position: 'relative', zIndex: 10,
          }}>
            {[
              { val: totalDeliveriesVal, label: 'Deliveries' },
              { val: todayDeliveriesVal, label: 'Today' },
              { val: `${kmVal} km`,      label: 'Distance' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div style={{ width: 1, background: '#F1F5F9', margin: '4px 0' }} />}
                <div style={{ flex: 1, textAlign: 'center', padding: '4px 6px' }}>
                  {/* show spinner while orders loading */}
                  {ordersLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}>
                      <IonSpinner name="dots" style={{ color: '#0A3526', width: 18, height: 18 }} />
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0A3526', lineHeight: 1, marginBottom: 5 }}>{s.val}</p>
                  )}
                  <p style={{ margin: 0, fontSize: 10, color: '#94A3B8', letterSpacing: 0.4, textTransform: 'uppercase' }}>{s.label}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ══ ERROR ════════════════════════════════════════════════════════ */}
        {!loading && error && (
          <div style={{ padding: 20, marginTop: 16 }}>
            <div style={{ background: '#FEF2F2', borderRadius: 16, padding: 20 }}>
              <p style={{ color: '#EF4444', fontWeight: 700, fontSize: 15, margin: '0 0 8px' }}>Error</p>
              <p style={{ color: '#64748B', fontSize: 13, margin: '0 0 16px' }}>{error}</p>
              <button onClick={loadProfile} style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ══ BODY ═════════════════════════════════════════════════════════ */}
        {!loading && !error && profile && (
          <div style={{ paddingBottom: 100 }}>
            {editMode ? (
              <>
                <Sec title="Personal Info">
                  <Field label="Full Name"    value={editName}    onChange={setEditName}    placeholder="Enter your name" />
                  <Field label="Phone"        value={editPhone}   onChange={setEditPhone}   placeholder="+91 XXXXX XXXXX" type="tel" />
                  <Field label="Email"        value={editEmail}   onChange={setEditEmail}   placeholder="email@example.com" type="email" last />
                </Sec>
                <Sec title="Work Info">
                  <Field label="Home Address" value={editAddress} onChange={setEditAddress} placeholder="Enter your address" last />
                </Sec>
              </>
            ) : (
              <>
                {/* Account Info */}
                <Sec title="Account Info">
                  <InfoRow icon={<PhoneIcon />}    iconBg="#ECFDF5" label="Phone"  value={phone}  />
                  <InfoRow icon={<EmailIcon />}    iconBg="#EFF6FF" label="Email"  value={email}  />
                  <InfoRow icon={<LocationIcon />} iconBg="#FDF2F8" label="Zone"   value={zone}   />
                  <InfoRow icon={<CalendarIcon />} iconBg="#F5F3FF" label="Joined" value={joined} last />
                </Sec>

                {/* Performance */}
                <Sec title="Performance">
                  {ordersLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '22px 0' }}>
                      <IonSpinner name="crescent" style={{ color: '#0A3526' }} />
                    </div>
                  ) : (
                    perfs.map((p, i) => (
                      <div key={p.label} style={{ padding: '12px 16px', borderBottom: i < perfs.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{p.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.value}%</span>
                        </div>
                        <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(p.value, 100)}%`, background: p.color, borderRadius: 99 }} />
                        </div>
                      </div>
                    ))
                  )}
                </Sec>

                {/* Settings */}
                <Sec title="Settings">
                  {[
                    { label: 'Accept New Orders',   sub: 'Toggle off to pause new orders', val: acceptOrders,  set: setAcceptOrders },
                    { label: 'Push Notifications',  sub: 'Order alerts and updates',       val: notifications, set: setNotifications },
                    { label: 'Share Live Location', sub: 'Required for active orders',     val: shareLocation, set: setShareLocation, last: true },
                  ].map(t => (
                    <div key={t.label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderBottom: t.last ? 'none' : '1px solid #F8FAFC',
                    }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#1E293B', marginBottom: 2 }}>{t.label}</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>{t.sub}</p>
                      </div>
                      <Toggle checked={t.val} onChange={t.set} />
                    </div>
                  ))}
                </Sec>

                {/* Logout */}
                <Sec title="">
                  <ActionRow icon={<LogoutIcon />} label="Logout" onClick={() => setShowLogout(true)} danger last />
                </Sec>
              </>
            )}
          </div>
        )}

        {/* Logout Alert */}
        <IonAlert
          isOpen={showLogout}
          header="Logout"
          message="Are you sure you want to logout?"
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Logout', role: 'destructive', handler: handleLogout },
          ]}
          onDidDismiss={() => setShowLogout(false)}
        />

        {/* Toast */}
        {toastMsg && (
          <div style={{
            position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            background: toastMsg.ok ? '#0A3526' : '#EF4444',
            color: '#fff', padding: '11px 24px', borderRadius: 99,
            fontSize: 13, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 9999, whiteSpace: 'nowrap',
          }}>
            {toastMsg.msg}
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default Profile;