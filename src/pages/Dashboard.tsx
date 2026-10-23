// Dashboard.tsx — Delivery Boy Dashboard

import React, { useState, useEffect, useCallback } from 'react';
import { Page } from '../App';
import { apiGet, apiPost } from '../api';
import Footer from '../components/Footer';

interface Props {
  onNavigate: (page: Page) => void;
  onOrderClick: (orderId: number | string, status?: string) => void;
  onWarehouseMap: (lat: number, lng: number, name: string, orderId: number) => void;
}

interface ActiveOrder {
  longitude(arg0: string, latitude: (arg0: string, latitude: any, arg2: string, longitude: any) => unknown, arg2: string, longitude: any): unknown;
  latitude(arg0: string, latitude: any, arg2: string, longitude: any): unknown;
  warehouse_lat(warehouse_lat: any): number;
  warehouse_lng(warehouse_lng: any): number;
  id: number | string;
  billing_name?: string;
  billing_phone?: string;
  billing_address?: string;
  billing_city?: string;
  billing_pincode?: string;
  distance?: string;
  eta?: string;
  amount: number;
  cod: number;
  status?: string;
  dstatus?: string;
  picked_at?: string;
  name?: string;
  vendor_name?: string;
  customer_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  warehouse_name?: string;
  warehouse?: { name?: string };
}

interface DashboardStats {
  delivered_today: number;
  earnings_today: number;
  cod_pending: number;
  active_count: number;
  km_today?: number;
  rating?: number;
  acceptance_rate?: number;
  cancel_count?: number;
}

interface WeeklyBar {
  day: string;
  amount: number;
}

interface UserInfo {
  name: string;
  initials?: string;
  zone?: string;
  vehicle?: string;
}

interface DashboardData {
  user: UserInfo;
  stats: DashboardStats;
  weekly_earnings?: WeeklyBar[];
  deliveredToday?: number;
  earningsToday?: number;
  codPending?: number;
  activeOrders?: ActiveOrder[];
  weeklyEarnings?: WeeklyBar[];
}

interface Notif {
  title: string;
  body: string;
  color: string;
  icon: string;
  unread: boolean;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const resolveField = <T,>(obj: Record<string, T>, ...keys: string[]): T | undefined => {
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
};

const getOrderStatus = (o: ActiveOrder): string =>
  String(resolveField(o as any, 'dstatus', 'status') ?? 'assigned').toLowerCase().trim();

const getCustomerName = (o: ActiveOrder): string =>
  String(resolveField(o as any, 'billing_name', 'customer_name', 'name') ?? '').trim();

const getPhone = (o: ActiveOrder): string =>
  String(resolveField(o as any, 'billing_phone', 'phone') ?? '').trim();

const getCity = (o: ActiveOrder): string =>
  String(resolveField(o as any, 'billing_city', 'city') ?? '').trim();

const getAddress = (o: ActiveOrder): string =>
  String(resolveField(o as any, 'billing_address', 'address') ?? '').trim();

const getVendor = (o: ActiveOrder): string =>
  String(resolveField(o as any, 'vendor_name') ?? o.warehouse?.name ?? '').trim();

const statusLabel = (s: string): string =>
({
  assigned: 'Assigned', accepted: 'Accepted', picked: 'Picked Up',
  on_the_way: 'On The Way', delivered: 'Delivered', cancelled: 'Cancelled',
}[s] ?? s);

const stripeColor = (s: string): string =>
({
  assigned: '#f97316', accepted: '#3b82f6', picked: '#f97316',
  on_the_way: '#f59e0b', delivered: '#22c55e', cancelled: '#94a3b8',
}[s] ?? '#94a3b8');

const badgeStyle = (s: string): { background: string; color: string; border: string } =>
({
  assigned: { background: '#fff7ed', color: '#f97316', border: '1px solid #fed7aa' },
  accepted: { background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' },
  picked: { background: '#fff7ed', color: '#f97316', border: '1px solid #fed7aa' },
  on_the_way: { background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a' },
  delivered: { background: '#f0fdf4', color: '#22c55e', border: '1px solid #bbf7d0' },
  cancelled: { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' },
}[s] ?? { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' });

const safeArray = (v: unknown): unknown[] =>
  Array.isArray(v) ? v : Array.isArray((v as any)?.data) ? (v as any).data : [];

const initials = (name: string): string =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

// ─── CSS ────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
  :root {
    --orange:#f97316; --green:#22c55e; --red:#ef4444; --blue:#3b82f6; --amber:#f59e0b;
    --t1:#1e293b; --t2:#64748b; --t3:#94a3b8; --bg:#f8fafc;
    --font:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
    --r:14px; --rm:10px; --shadow:0 1px 4px rgba(0,0,0,0.07);
  }
  *{box-sizing:border-box;}
  .db-root{font-family:var(--font);color:var(--t1);display:flex;flex-direction:column;gap:16px;padding-bottom:0;background:var(--bg);min-height:100vh;}

  /* Hero */
  .hero{background:linear-gradient(135deg,#f97316 0%,#fb923c 100%);border-radius:18px;padding:20px;position:relative;overflow:hidden;}
  .hero::before{content:'';position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.1);pointer-events:none;}
  .hero::after{content:'';position:absolute;bottom:-20px;left:60px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.06);pointer-events:none;}
  .hero-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}
  .hero-earn{flex:1;}
  .earn-lbl{font-size:11px;color:rgba(255,255,255,0.75);margin-bottom:3px;font-weight:500;}
  .earn-val{font-size:30px;font-weight:700;font-family:var(--mono);color:#fff;line-height:1;}
  .earn-sub{font-size:11px;color:rgba(255,255,255,0.85);font-weight:600;margin-top:4px;}
  .hero-controls{display:flex;align-items:center;gap:8px;}
  .bell-btn{position:relative;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);border:1.5px solid rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
  .bell-badge{position:absolute;top:-3px;right:-3px;min-width:17px;height:17px;background:#ef4444;border-radius:99px;border:2px solid #f97316;display:flex;align-items:center;justify-content:center;}
  .bell-badge-txt{font-size:9px;font-weight:800;color:#fff;font-family:var(--font);padding:0 3px;}
  .online-pill{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.2);border:1.5px solid rgba(255,255,255,0.5);border-radius:20px;padding:8px 14px;cursor:pointer;font-size:12px;font-weight:700;color:#fff;font-family:var(--font);transition:opacity .2s;}
  .online-pill:disabled{opacity:0.6;cursor:not-allowed;}
  .status-dot{width:7px;height:7px;border-radius:50%;}
  .hero-user{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
  .avatar{width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;flex-shrink:0;border:2px solid rgba(255,255,255,0.4);}
  .hero-name{font-size:16px;font-weight:700;color:#fff;margin-bottom:2px;}
  .hero-sub{font-size:12px;color:rgba(255,255,255,0.7);}
  .hero-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
  .hstat{background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);border-radius:var(--rm);padding:10px 12px;}
  .hstat-val{font-size:20px;font-weight:700;font-family:var(--mono);color:#fff;}
  .hstat-lbl{font-size:10px;color:rgba(255,255,255,0.75);margin-top:3px;font-weight:500;}

  /* Section */
  .sec-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
  .sec-title{font-size:14px;font-weight:700;color:var(--t1);}
  .sec-link{font-size:12px;color:var(--orange);font-weight:600;background:none;border:none;cursor:pointer;font-family:var(--font);padding:0;}
  .pulse-dot{width:8px;height:8px;border-radius:50%;background:var(--orange);display:inline-block;animation:pulse 2s ease-in-out infinite;}

  /* New Order Banner */
  .no-banner{background:#fff;border:1.5px solid #fed7aa;border-radius:var(--r);padding:16px;position:relative;overflow:hidden;box-shadow:var(--shadow);margin-bottom:10px;}
  .no-badge{position:absolute;top:12px;right:12px;font-size:9px;font-weight:700;letter-spacing:1px;background:var(--orange);color:#fff;padding:3px 8px;border-radius:5px;text-transform:uppercase;}
  .no-top{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
  .no-icon{width:40px;height:40px;border-radius:10px;background:#fff7ed;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .no-id{font-size:11px;color:var(--orange);font-family:var(--mono);margin-bottom:3px;}
  .no-name{font-size:14px;font-weight:700;color:var(--t1);margin-bottom:2px;}
  .no-vendor{font-size:11px;color:var(--t2);}
  .no-addr-row{display:flex;align-items:flex-start;gap:7px;margin-bottom:12px;}
  .no-addr-text{font-size:12px;color:var(--t2);margin-bottom:2px;}
  .no-addr-meta{font-size:11px;color:var(--t3);}
  .no-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;}
  .no-cell{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;}
  .no-cell-lbl{font-size:10px;color:var(--t3);margin-bottom:3px;}
  .no-cell-val{font-size:15px;font-weight:700;font-family:var(--mono);color:var(--t1);}
  .no-btns{display:flex;gap:8px;}
  .btn-accept{flex:1;background:var(--orange);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;padding:11px;cursor:pointer;font-family:var(--font);transition:background .15s;}
  .btn-accept:hover{background:#ea6c05;}
  .btn-accept:disabled{opacity:0.6;cursor:not-allowed;}
  .btn-reject{padding:11px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:var(--red);font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font);}

  /* Order Card */
  .ocard{background:#fff;border:1px solid #f0f0f0;border-radius:var(--r);overflow:hidden;margin-bottom:10px;position:relative;cursor:pointer;box-shadow:var(--shadow);transition:box-shadow .2s;}
  .ocard:hover{box-shadow:0 4px 12px rgba(0,0,0,0.10);}
  .ocard-stripe{position:absolute;left:0;top:0;width:4px;height:100%;}
  .ocard-body{padding:14px 14px 14px 20px;}
  .ocard-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
  .oc-id{font-size:10px;color:var(--orange);font-family:var(--mono);margin-bottom:3px;}
  .oc-name{font-size:14px;font-weight:700;color:var(--t1);margin-bottom:2px;}
  .oc-phone{font-size:11px;color:var(--t2);}
  .oc-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin-left:10px;}
  .oc-amt{font-size:16px;font-weight:700;font-family:var(--mono);color:var(--t1);}
  .badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:.3px;}
  .badge-dot{width:5px;height:5px;border-radius:50%;}
  .ocard-addr{display:flex;gap:7px;align-items:flex-start;padding-top:10px;border-top:1px solid #f0f0f0;}
  .ocard-addr-text{font-size:12px;color:var(--t2);margin-bottom:3px;}
  .ocard-addr-meta{display:flex;gap:8px;font-size:11px;color:var(--t3);align-items:center;flex-wrap:wrap;}
  .cod-tag{background:#fff7ed;color:var(--orange);font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;border:1px solid #fed7aa;}
  .ocard-footer{display:flex;justify-content:space-between;align-items:center;margin-top:12px;}
  .ocard-footer-info{font-size:11px;color:var(--t3);}
  .btn-pickup{padding:7px 16px;border:none;border-radius:7px;background:var(--orange);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);}
  .btn-deliver{padding:7px 16px;border:none;border-radius:7px;background:var(--green);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);}
  .btn-map{padding:7px 16px;border:none;border-radius:7px;background:var(--amber);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);display:flex;align-items:center;gap:5px;}

  /* Weekly Chart */
  .chart-card{background:#fff;border:1px solid #f0f0f0;border-radius:var(--r);padding:16px;box-shadow:var(--shadow);}
  .chart-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px;}
  .chart-total{font-size:22px;font-weight:700;font-family:var(--mono);color:var(--t1);}
  .chart-lbl{font-size:11px;color:var(--t3);}
  .bars{display:flex;align-items:flex-end;gap:6px;height:72px;}
  .bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;height:100%;justify-content:flex-end;}
  .bar{width:100%;border-radius:4px 4px 0 0;min-height:4px;transition:height .5s cubic-bezier(.4,0,.2,1);}
  .bar-lbl{font-size:10px;font-weight:500;color:var(--t3);}

  /* Stats Grid */
  .stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .stat-card{background:#fff;border:1px solid #f0f0f0;border-radius:var(--r);padding:14px 16px;box-shadow:var(--shadow);}
  .stat-icon{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;}
  .stat-val{font-size:22px;font-weight:700;font-family:var(--mono);margin-bottom:2px;}
  .stat-lbl{font-size:11px;color:var(--t2);font-weight:500;}
  .stat-sub{font-size:10px;color:var(--t3);margin-top:2px;}

  /* On the way live banner */
  .live-banner{background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border:1.5px solid #fde68a;border-radius:var(--r);padding:12px 16px;display:flex;align-items:center;gap:10px;margin-bottom:6px;}
  .live-dot{width:10px;height:10px;border-radius:50%;background:#f59e0b;animation:livePulse 1.5s ease-in-out infinite;flex-shrink:0;}
  .live-text{font-size:13px;font-weight:700;color:#92400e;flex:1;}
  .live-sub{font-size:11px;color:#b45309;margin-top:2px;}
  .btn-open-map{padding:8px 14px;background:#f59e0b;border:none;border-radius:8px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);white-space:nowrap;}

  /* Notif panel */
  .notif-popup{position:fixed;top:0;left:0;right:0;bottom:0;z-index:900;}
  .notif-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.3);}
  .notif-panel{position:absolute;top:80px;right:16px;left:16px;background:#fff;border-radius:18px;box-shadow:0 16px 48px rgba(0,0,0,0.18);max-height:70vh;overflow-y:auto;z-index:901;}
  .notif-panel-hdr{padding:14px 16px 10px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;align-items:center;}
  .notif-panel-title{font-size:14px;font-weight:700;color:#1e293b;}
  .notif-new-pill{font-size:11px;background:#fef2f2;color:#ef4444;padding:2px 7px;border-radius:99px;margin-left:6px;font-weight:700;}

  /* Empty */
  .empty-box{background:#fff;border:1px solid #f0f0f0;border-radius:var(--r);padding:30px 20px;text-align:center;box-shadow:var(--shadow);}

  /* Error */
  .err-box{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;color:var(--red);text-align:center;font-size:14px;}

  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
  @keyframes livePulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(1.3);}}
  @keyframes bellRing{0%,100%{transform:rotate(0)}20%{transform:rotate(-15deg)}40%{transform:rotate(15deg)}60%{transform:rotate(-10deg)}80%{transform:rotate(10deg)}}
  @keyframes slideIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
  .bell-ring{animation:bellRing .6s ease;}
  .slide-in{animation:slideIn .25s ease both;}
`;

// ─── Sub-components ──────────────────────────────────────────────────────────

const BellIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const MapPinIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const MiniNotif: React.FC<Notif> = ({ title, body, color, icon, unread }) => (
  <div style={{ display: 'flex', gap: 10, padding: '11px 16px', borderBottom: '1px solid #f9fafb', background: unread ? `${color}0d` : '#fff' }}>
    <div style={{ fontSize: 18, flexShrink: 0, width: 32, textAlign: 'center' }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: unread ? 700 : 500, color: '#111827', lineHeight: 1.3 }}>{title}</p>
      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{body}</p>
    </div>
    {unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4 }} />}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const Dashboard: React.FC<Props> = ({ onNavigate, onOrderClick, onWarehouseMap }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [pendingOrders, setPendingOrders] = useState<ActiveOrder[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingId, setAcceptingId] = useState<number | string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);
  const [bellCount, setBellCount] = useState(0);
  const [bellRing, setBellRing] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);

  // ── GPS helpers ─────────────────────────────────────────────────────────
  const startTracking = useCallback((orderId: number | string) => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      async pos => {
        try {
          await apiPost('/delivery/update-location', {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        } catch { /* silent */ }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 },
    );
    setWatchId(id);
  }, []);

  const stopTracking = useCallback(() => {
    setWatchId(prev => {
      if (prev !== null) navigator.geolocation.clearWatch(prev);
      return null;
    });
  }, []);

  // ── Load data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [dashRes, activeRes, newRes] = await Promise.all([
        apiGet('dashboard'),
        apiGet('delivery/orders'),
        apiGet('delivery/new'),
      ]);

      if (dashRes?.success || dashRes?.data || dashRes?.user) {
        const d: DashboardData = dashRes?.data ?? dashRes;
        setDashData(d);
        const weekly: WeeklyBar[] = d.weekly_earnings ?? d.weeklyEarnings ?? [];
        setWeeklyData(weekly);
      }

      const active = safeArray(activeRes) as ActiveOrder[];
      setActiveOrders(active);

      const newArr = safeArray(newRes) as ActiveOrder[];
      const assigned = newArr.filter(o => getOrderStatus(o) === 'assigned');
      const prevCount = pendingOrders.length;
      setPendingOrders(assigned);

      const nf: Notif[] = assigned.map(o => ({
        title: `New order #${o.id} assigned!`,
        body: `${getCustomerName(o)} · ₹${o.amount} · ${getCity(o)}`,
        color: '#f97316', icon: '📦', unread: true,
      }));
      setNotifs(nf);
      const unread = nf.length;
      if (unread > prevCount) {
        setBellRing(true);
        setTimeout(() => setBellRing(false), 700);
      }
      setBellCount(unread);

    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 30000);
    return () => clearInterval(t);
  }, [loadData]);

  // ── Online / Offline toggle ───────────────────────────────────────────────
  const handleToggleOnline = async () => {
    if (togglingStatus) return;
    const newStatus = !isOnline;
    setTogglingStatus(true);
    try {
      await apiPost('delivery/status', {
        is_online: newStatus ? 1 : 0,
      });
      setIsOnline(newStatus);
    } catch {
      setError('Status update failed. Please try again.');
    } finally {
      setTogglingStatus(false);
    }
  };

  // ── Accept order ─────────────────────────────────────────────────────────
  const handleAccept = async (orderId: number | string) => {
    setAcceptingId(orderId);
    try {
      await apiPost(`delivery/orders/${orderId}/accept`, {});
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      setNotifs(prev => prev.filter(n => !n.title.includes(`#${orderId}`)));
      setBellCount(prev => Math.max(0, prev - 1));
      await loadData();
    } catch {
      setError('Could not accept order. Try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = (orderId: number | string) => {
    setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    setNotifs(prev => prev.filter(n => !n.title.includes(`#${orderId}`)));
    setBellCount(prev => Math.max(0, prev - 1));
  };

  // ── Status update ─────────────────────────────────────────────────────────
  const handleStatusUpdate = async (
    e: React.MouseEvent,
    orderId: number | string,
    dstatus: 'picked' | 'on_the_way' | 'delivered',
  ) => {
    e.stopPropagation();
    setUpdatingId(orderId);
    try {
      await apiPost(`delivery/orders/${orderId}/status`, { status: dstatus });

      if (dstatus === 'on_the_way') {
        startTracking(orderId);
        onOrderClick(orderId, 'on_the_way');
        return;
      }

      if (dstatus === 'delivered') {
        stopTracking();
      }

      await loadData();
    } catch {
      setError('Status update failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Bell ─────────────────────────────────────────────────────────────────
  const handleBellClick = () => {
    setShowNotifPanel(p => !p);
    if (!showNotifPanel) {
      setBellCount(0);
      setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
    }
  };

  // ── Derived values ───────────────────────────────────────────────────────
  const user = dashData?.user;
  const stats = dashData?.stats;
  const earningsToday = stats?.earnings_today ?? (dashData as any)?.earningsToday ?? 0;
  const deliveredToday = stats?.delivered_today ?? (dashData as any)?.deliveredToday ?? 0;
  const codPending = stats?.cod_pending ?? (dashData as any)?.codPending ?? 0;
  const kmToday = stats?.km_today ?? 0;
  const rating = stats?.rating ?? 0;
  const acceptance = stats?.acceptance_rate ?? 0;
  const maxEarning = Math.max(...weeklyData.map(w => w.amount), 1);
  const weeklyTotal = weeklyData.reduce((s, w) => s + w.amount, 0);

  const onTheWayOrders = activeOrders.filter(o => getOrderStatus(o) === 'on_the_way');

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#94a3b8', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Loading dashboard…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (error && !dashData) return (
    <div className="err-box">
      <style>{css}</style>
      <p style={{ margin: '0 0 12px' }}>{error}</p>
      <button onClick={loadData} style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Retry</button>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="db-root">

        {/* ── Error Toast ── */}
        {error && dashData && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {error}
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>×</button>
          </div>
        )}

        {/* ── Hero ── */}
        <div className="hero">
          <div className="hero-top">
            <div className="hero-earn">
              <div className="earn-lbl">Today's Earnings</div>
              <div className="earn-val">₹{Math.round(earningsToday).toLocaleString('en-IN')}</div>
              <div className="earn-sub">▲ Updated live</div>
            </div>
            <div className="hero-controls">
              <button className={`bell-btn ${bellRing ? 'bell-ring' : ''}`} onClick={handleBellClick} aria-label="Notifications">
                <BellIcon size={20} color="#fff" />
                {bellCount > 0 && (
                  <div className="bell-badge">
                    <span className="bell-badge-txt">{bellCount > 9 ? '9+' : bellCount}</span>
                  </div>
                )}
              </button>

              <button
                className="online-pill"
                onClick={handleToggleOnline}
                disabled={togglingStatus}
              >
                {togglingStatus ? (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.5)', borderTop: '1.5px solid #fff', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                ) : (
                  <span
                    className="status-dot"
                    style={{
                      background: isOnline ? '#4ade80' : 'rgba(255,255,255,0.4)',
                      boxShadow: isOnline ? '0 0 6px #4ade8066' : 'none',
                    }}
                  />
                )}
                {togglingStatus ? 'Saving…' : isOnline ? 'Online' : 'Offline'}
              </button>
            </div>
          </div>

          {user && (
            <div className="hero-user">
              <div className="avatar">{user.initials ?? initials(user.name)}</div>
              <div>
                <div className="hero-name">{user.name}</div>
                {(user.zone || user.vehicle) && (
                  <div className="hero-sub">
                    {[user.zone && `Zone: ${user.zone}`, user.vehicle].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="hero-stats">
            <div className="hstat">
              <div className="hstat-val">{activeOrders.length}</div>
              <div className="hstat-lbl">Active</div>
            </div>
            <div className="hstat">
              <div className="hstat-val">{deliveredToday}</div>
              <div className="hstat-lbl">Delivered</div>
            </div>
            <div className="hstat">
              <div className="hstat-val">₹{Math.round(codPending).toLocaleString('en-IN')}</div>
              <div className="hstat-lbl">COD Due</div>
            </div>
          </div>
        </div>

        {/* ── Notification Panel ── */}
        {showNotifPanel && (
          <div className="notif-popup">
            <div className="notif-overlay" onClick={() => setShowNotifPanel(false)} />
            <div className="notif-panel">
              <div className="notif-panel-hdr">
                <span className="notif-panel-title">
                  Notifications
                  {notifs.filter(n => n.unread).length > 0 && (
                    <span className="notif-new-pill">{notifs.filter(n => n.unread).length} new</span>
                  )}
                </span>
                <button
                  onClick={() => { setShowNotifPanel(false); onNavigate('notifications'); }}
                  style={{ fontSize: 12, color: '#f97316', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  See All →
                </button>
              </div>
              {notifs.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 24, margin: '0 0 8px' }}>🔔</p>
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No new notifications</p>
                </div>
              ) : (
                notifs.map((n, i) => <MiniNotif key={i} {...n} />)
              )}
              {notifs.length > 0 && (
                <div
                  onClick={() => { setShowNotifPanel(false); onNavigate('notifications'); }}
                  style={{ padding: '12px 16px', textAlign: 'center', cursor: 'pointer', borderTop: '1px solid #f3f4f6' }}
                >
                  <span style={{ fontSize: 13, color: '#f97316', fontWeight: 600 }}>See All →</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LIVE: On The Way Banner ── */}
        {onTheWayOrders.length > 0 && (
          <div>
            {onTheWayOrders.map(order => (
              <div className="live-banner" key={order.id}>
                <div className="live-dot" />
                <div style={{ flex: 1 }}>
                  <div className="live-text">🛵 Delivery in progress — #{order.id}</div>
                  <div className="live-sub">{getCustomerName(order)} · {getCity(order)}</div>
                </div>
                <button
                  className="btn-open-map"
                  onClick={() => onOrderClick(order.id, 'on_the_way')}
                >
                  Open Map
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── New Order Requests ── */}
        {pendingOrders.length > 0 && (
          <div>
            <div className="sec-hdr">
              <span className="sec-title">New Requests ({pendingOrders.length})</span>
              <span className="pulse-dot" />
            </div>
            {pendingOrders.map(order => (
              <div className="no-banner slide-in" key={order.id}>
                <span className="no-badge">New</span>
                <div className="no-top">
                  <div className="no-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 8h14M5 8a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v0a2 2 0 01-2 2M5 8l1 10a2 2 0 002 2h8a2 2 0 002-2L19 8" />
                    </svg>
                  </div>
                  <div>
                    <div className="no-id">#{order.id}</div>
                    <div className="no-name">{getCustomerName(order)}</div>
                    <div className="no-vendor">{getVendor(order)}</div>
                  </div>
                </div>
                {(getCity(order) || getAddress(order)) && (
                  <div className="no-addr-row">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" style={{ marginTop: 1, flexShrink: 0 }}>
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <div>
                      <div className="no-addr-text">{[getCity(order), getAddress(order)].filter(Boolean).join(', ')}</div>
                      <div className="no-addr-meta">
                        {order.distance && <span>{order.distance}</span>}
                        {order.eta && <span> · ~{order.eta}</span>}
                        {order.cod === 1 && <span style={{ color: '#f97316', fontWeight: 600, marginLeft: 6 }}>COD ₹{order.amount}</span>}
                      </div>
                    </div>
                  </div>
                )}
                <div className="no-grid">
                  <div className="no-cell">
                    <div className="no-cell-lbl">Value</div>
                    <div className="no-cell-val">₹{order.amount}</div>
                  </div>
                  <div className="no-cell">
                    <div className="no-cell-lbl">COD</div>
                    <div className="no-cell-val" style={{ fontSize: 13, color: order.cod ? '#f97316' : '#22c55e' }}>{order.cod ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="no-cell">
                    <div className="no-cell-lbl">Status</div>
                    <div className="no-cell-val" style={{ fontSize: 12 }}>Assigned</div>
                  </div>
                </div>
                <div className="no-btns">
                  <button className="btn-accept" disabled={acceptingId === order.id} onClick={() => handleAccept(order.id)}>
                    {acceptingId === order.id ? 'Accepting…' : 'Accept Order'}
                  </button>
                  <button className="btn-reject" onClick={() => handleReject(order.id)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Active Orders ── */}
        <div>
          <div className="sec-hdr">
            <span className="sec-title">Active Orders ({activeOrders.length})</span>
            <button className="sec-link" onClick={() => onNavigate('orders')}>View all →</button>
          </div>

          {activeOrders.length > 0 ? activeOrders.map(order => {
            const st = getOrderStatus(order);
            const bs = badgeStyle(st);
            const isUpdating = updatingId === order.id;
            const isOnTheWay = st === 'on_the_way';

            return (
              <div
                className="ocard"
                key={order.id}
                onClick={() => onOrderClick(order.id, st)}
              >
                <div className="ocard-stripe" style={{ background: stripeColor(st) }} />
                <div className="ocard-body">
                  <div className="ocard-top">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="oc-id">#{order.id}</div>
                      <div className="oc-name">{getCustomerName(order)}</div>
                      <div className="oc-phone">{getPhone(order)}</div>
                    </div>
                    <div className="oc-right">
                      <span className="badge" style={bs}>
                        <span className="badge-dot" style={{ background: bs.color }} />
                        {statusLabel(st)}
                      </span>
                      <span className="oc-amt">₹{order.amount}</span>
                    </div>
                  </div>
                  <div className="ocard-addr">
                    <svg style={{ marginTop: 1, flexShrink: 0 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <div>
                      <div className="ocard-addr-text">
                        {[getCity(order), getAddress(order)].filter(Boolean).join(', ')}
                      </div>
                      <div className="ocard-addr-meta">
                        {order.distance && <span>{order.distance}</span>}
                        {order.cod === 1 && <span className="cod-tag">COD</span>}
                      </div>
                    </div>
                  </div>
                  <div className="ocard-footer" onClick={e => e.stopPropagation()}>
                    <div className="ocard-footer-info">
                      {order.picked_at ? `Picked: ${order.picked_at}` : 'Ready at store'}
                    </div>
                    {(st === 'assigned' || st === 'accepted') && (
                      <button
                        className="btn-pickup"
                        onClick={(e) => {
                          e.stopPropagation();
                          onWarehouseMap(
                            Number(order.warehouse_lat),
                            Number(order.warehouse_lng),
                            order.warehouse_name ?? '',
                            Number(order.id)
                          );
                        }}
                      >
                        Go To Warehouse
                      </button>
                    )}
                    {st === 'picked' && (
                      <button className="btn-map" disabled={isUpdating} onClick={e => handleStatusUpdate(e, order.id, 'on_the_way')}>
                        {isUpdating ? '…' : (<><MapPinIcon size={13} color="#fff" /> Start Delivery</>)}
                      </button>
                    )}
                    {isOnTheWay && (
                      <button
                        className="btn-deliver"
                        style={{ background: '#f59e0b' }}
                        onClick={e => { e.stopPropagation(); onOrderClick(order.id, 'on_the_way'); }}
                      >
                        🗺️ Open Map
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="empty-box">
              <p style={{ fontSize: 28, marginBottom: 8 }}>📭</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>No active orders</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>You're all caught up!</p>
            </div>
          )}
        </div>

        {/* ── Weekly Earnings Chart ── */}
        {weeklyData.length > 0 && (
          <div className="chart-card">
            <div className="chart-top">
              <div>
                <div className="chart-lbl">Weekly Earnings</div>
                <div className="chart-total">₹{Math.round(weeklyTotal).toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div className="bars">
              {weeklyData.map((w, i) => (
                <div className="bar-col" key={i}>
                  <div className="bar" style={{
                    height: `${Math.round((w.amount / maxEarning) * 100)}%`,
                    background: w.amount === maxEarning ? '#f97316' : '#fed7aa',
                  }} />
                  <span className="bar-lbl">{w.day}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats Grid ── */}
        {stats && (
          <div className="stats-grid">
            {kmToday > 0 && (
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#eff6ff' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
                <div className="stat-val" style={{ color: '#3b82f6' }}>{kmToday}</div>
                <div className="stat-lbl">KM Today</div>
              </div>
            )}
            {rating > 0 && (
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fefce8' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                </div>
                <div className="stat-val" style={{ color: '#f59e0b' }}>{rating.toFixed(1)}</div>
                <div className="stat-lbl">Your Rating</div>
              </div>
            )}
            {acceptance > 0 && (
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#f0fdf4' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="stat-val" style={{ color: '#22c55e' }}>{acceptance}%</div>
                <div className="stat-lbl">Acceptance</div>
              </div>
            )}
            {(stats.cancel_count ?? 0) >= 0 && (
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fef2f2' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                </div>
                <div className="stat-val" style={{ color: '#ef4444' }}>{stats.cancel_count ?? 0}</div>
                <div className="stat-lbl">Cancels</div>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <Footer onNavigate={onNavigate} active="dashboard" />

      </div>
    </>
  );
};

export default Dashboard;