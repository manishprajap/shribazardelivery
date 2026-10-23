import React, { useState, useEffect } from 'react';
import { Page } from '../App';
import { apiGet, apiPost } from '../api';
import { markOrderDelivered } from '../hooks/useAutoLogout';

interface Props {
  onNavigate: (page: Page) => void;
  orderId?: number | string;
}

interface OrderDetail {
  id: number | string;
  status: 'assigned' | 'picked' | 'delivered' | 'cancelled';
  amount: number;
  cod: number;
  billing_name: string;
  billing_phone: string;
  billing_address: string;
  billing_city: string;
  billing_pincode?: string;
  distance?: string;
  eta?: string;
  picked_at?: string;
  delivered_at?: string;
  created_at?: string;
  user?: { name: string; phone?: string };
  warehouse?: { name: string; address?: string; phone?: string };
  items?: { name: string; qty: number; price: number }[];
  delivery_fee?: number;
  notes?: string;
}

const statusLabel = (s: string) =>
  ({ assigned: 'Assigned', picked: 'Picked Up', delivered: 'Delivered', cancelled: 'Cancelled' }[s] ?? s);

const statusColor = (s: string) =>
  ({ assigned: '#E07B00', picked: '#f97316', delivered: '#22c55e', cancelled: '#ef4444' }[s] ?? '#94a3b8');

const statusBg = (s: string) =>
  ({ assigned: '#fff7ed', picked: '#fff7ed', delivered: '#f0fdf4', cancelled: '#fef2f2' }[s] ?? '#f1f5f9');

const statusBorder = (s: string) =>
  ({ assigned: '#fed7aa', picked: '#fed7aa', delivered: '#bbf7d0', cancelled: '#fecaca' }[s] ?? '#e2e8f0');

const stripeColor = (s: string) =>
  ({ assigned: '#f97316', picked: '#f97316', delivered: '#22c55e', cancelled: '#94a3b8' }[s] ?? '#94a3b8');

// Timeline steps
const STEPS = ['assigned', 'picked', 'delivered'];
const stepLabel = (s: string) =>
  ({ assigned: 'Order Assigned', picked: 'Picked Up', delivered: 'Delivered' }[s] ?? s);
const stepIcon = (s: string, done: boolean, active: boolean) => {
  const col = done || active ? '#fff' : '#94a3b8';
  if (s === 'assigned') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14M5 8a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v0a2 2 0 01-2 2M5 8l1 10a2 2 0 002 2h8a2 2 0 002-2L19 8" />
    </svg>
  );
  if (s === 'picked') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');
  :root {
    --bg:#f8fafc; --s1:#ffffff;
    --border:rgba(0,0,0,0.07); --border2:rgba(0,0,0,0.12);
    --orange:#f97316; --green:#22c55e; --red:#ef4444; --blue:#3b82f6;
    --t1:#1e293b; --t2:#64748b; --t3:#94a3b8;
    --font:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
    --r:14px; --rm:10px;
  }
  .od-root { font-family:var(--font); color:var(--t1); display:flex; flex-direction:column; gap:14px; padding-bottom:100px; background:var(--bg); }

  /* Header */
  .od-header { display:flex; align-items:center; gap:12px; padding:4px 0 8px; }
  .back-btn { width:38px; height:38px; border-radius:10px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; box-shadow:0 1px 3px rgba(0,0,0,0.06); }
  .od-title { font-size:18px; font-weight:700; color:var(--t1); }
  .od-subtitle { font-size:12px; color:var(--t3); margin-top:1px; font-family:var(--mono); }

  /* Status Hero */
  .status-hero { border-radius:var(--r); padding:18px; position:relative; overflow:hidden; }
  .status-hero::before { content:''; position:absolute; top:-30px; right:-30px; width:120px; height:120px; border-radius:50%; background:rgba(255,255,255,0.12); pointer-events:none; }
  .sh-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; }
  .sh-status { font-size:22px; font-weight:700; color:#fff; }
  .sh-id { font-size:11px; color:rgba(255,255,255,0.7); font-family:var(--mono); margin-bottom:4px; }
  .sh-amt { font-size:28px; font-weight:700; font-family:var(--mono); color:#fff; }
  .sh-amt-lbl { font-size:11px; color:rgba(255,255,255,0.7); }
  .cod-chip { background:rgba(255,255,255,0.2); border:1.5px solid rgba(255,255,255,0.4); border-radius:6px; padding:3px 9px; font-size:11px; font-weight:700; color:#fff; display:inline-block; margin-top:6px; }

  /* Timeline */
  .timeline-card { background:#fff; border:1px solid #f0f0f0; border-radius:var(--r); padding:16px 18px; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
  .tl-title { font-size:12px; font-weight:700; color:var(--t2); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:16px; }
  .tl-row { display:flex; align-items:flex-start; gap:12px; position:relative; }
  .tl-row:not(:last-child)::after { content:''; position:absolute; left:15px; top:32px; width:2px; height:calc(100% - 8px); background:#e2e8f0; z-index:0; }
  .tl-row.done::after { background:#f97316; }
  .tl-dot { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; z-index:1; border:2px solid #e2e8f0; background:#f8fafc; }
  .tl-dot.done { background:#f97316; border-color:#f97316; }
  .tl-dot.active { background:#f97316; border-color:#f97316; box-shadow:0 0 0 4px rgba(249,115,22,0.15); }
  .tl-dot.delivered { background:#22c55e; border-color:#22c55e; }
  .tl-info { padding-top:5px; padding-bottom:16px; }
  .tl-lbl { font-size:13px; font-weight:600; color:var(--t1); margin-bottom:2px; }
  .tl-lbl.inactive { color:var(--t3); }
  .tl-time { font-size:11px; color:var(--t3); }

  /* Section card */
  .sec-card { background:#fff; border:1px solid #f0f0f0; border-radius:var(--r); padding:16px 18px; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
  .sc-title { font-size:12px; font-weight:700; color:var(--t3); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px; }
  .info-row { display:flex; align-items:flex-start; gap:10px; margin-bottom:10px; }
  .info-row:last-child { margin-bottom:0; }
  .info-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .info-label { font-size:11px; color:var(--t3); margin-bottom:2px; }
  .info-value { font-size:13px; font-weight:600; color:var(--t1); }
  .info-sub { font-size:11px; color:var(--t2); margin-top:1px; }
  .divider { border:none; border-top:1px solid #f0f0f0; margin:12px 0; }

  /* Items */
  .item-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f8fafc; }
  .item-row:last-child { border-bottom:none; }
  .item-name { font-size:13px; color:var(--t1); font-weight:500; }
  .item-qty { font-size:11px; color:var(--t3); margin-top:1px; }
  .item-price { font-size:13px; font-weight:700; font-family:var(--mono); color:var(--t1); }

  /* Total row */
  .total-row { display:flex; justify-content:space-between; align-items:center; margin-top:4px; }
  .total-lbl { font-size:12px; color:var(--t2); }
  .total-val { font-size:13px; font-weight:600; font-family:var(--mono); color:var(--t1); }
  .grand-row { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#f8fafc; border-radius:8px; margin-top:8px; }
  .grand-lbl { font-size:13px; font-weight:700; color:var(--t1); }
  .grand-val { font-size:16px; font-weight:700; font-family:var(--mono); color:#f97316; }

  /* Action buttons */
  .action-bar { position:fixed; bottom:0; left:0; right:0; background:#fff; border-top:1px solid #f0f0f0; padding:14px 16px; display:flex; gap:10px; z-index:100; box-shadow:0 -4px 12px rgba(0,0,0,0.06); }
  .btn-primary { flex:1; background:#f97316; border:none; border-radius:10px; color:#fff; font-size:14px; font-weight:700; padding:13px; cursor:pointer; font-family:var(--font); transition:background .15s; }
  .btn-primary:hover { background:#ea6c05; }
  .btn-primary.green { background:#22c55e; }
  .btn-primary.green:hover { background:#16a34a; }
  .btn-secondary { padding:13px 18px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; color:var(--t1); font-size:13px; font-weight:600; cursor:pointer; font-family:var(--font); }
  .btn-call { width:48px; height:48px; border-radius:10px; background:#f0fdf4; border:1px solid #bbf7d0; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }

  /* Notes */
  .notes-box { background:#fffbeb; border:1px solid #fef08a; border-radius:8px; padding:10px 12px; display:flex; gap:8px; align-items:flex-start; }
  .notes-text { font-size:12px; color:#854d0e; line-height:1.5; }

  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  .od-root > * { animation:fadeUp 0.25s ease both; }
  .od-root > *:nth-child(1) { animation-delay:0s; }
  .od-root > *:nth-child(2) { animation-delay:0.04s; }
  .od-root > *:nth-child(3) { animation-delay:0.08s; }
  .od-root > *:nth-child(4) { animation-delay:0.12s; }
  .od-root > *:nth-child(5) { animation-delay:0.16s; }
`;

const OrderDetail: React.FC<Props> = ({ onNavigate, orderId }) => {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiGet(`delivery/orders/${orderId}`);
        if (res.success) setOrder(res.data);
        else setError('Order not found.');
      } catch {
        setError('Network error. Check your connection.');
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
    else setLoading(false);
  }, [orderId]);

  const handleStatusUpdate = async (status: 'picked' | 'delivered') => {
    if (!order) return;
    setUpdating(true);
    try {
      await apiPost(`delivery/orders/${order.id}/status`, { status });
      setOrder(prev => prev ? { ...prev, status } : prev);

      // 🆕 Blinkit-style: order deliver hote hi 20-min auto-logout
      // timer start ho jata hai. Jab bhi delivery boy naya order
      // accept kare, us jagah `clearAutoLogoutTimer()` call karna
      // na bhoolein (hooks/useAutoLogout.ts dekhein).
      if (status === 'delivered') {
        markOrderDelivered();
      }
    } catch {
      setError('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading order details…</p>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !order) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="back-btn" onClick={() => onNavigate('dashboard')} style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700 }}>Order Details</span>
      </div>
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 20, color: '#ef4444', textAlign: 'center', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
        {error || 'Order not found.'}
      </div>
    </div>
  );

  const currentStep = STEPS.indexOf(order.status);
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  const heroGradient = isDelivered
    ? 'linear-gradient(135deg,#22c55e 0%,#16a34a 100%)'
    : isCancelled
    ? 'linear-gradient(135deg,#94a3b8 0%,#64748b 100%)'
    : 'linear-gradient(135deg,#f97316 0%,#fb923c 100%)';

  const subtotal = order.items?.reduce((s, i) => s + i.price * i.qty, 0) ?? order.amount;
  const deliveryFee = order.delivery_fee ?? 0;

  return (
    <>
      <style>{css}</style>
      <div className="od-root">

        {/* Header */}
        <div className="od-header">
          <button className="back-btn" onClick={() => onNavigate('dashboard')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <div className="od-title">Order Details</div>
            <div className="od-subtitle">#{order.id}</div>
          </div>
        </div>

        {/* Status Hero */}
        <div className="status-hero" style={{ background: heroGradient }}>
          <div className="sh-top">
            <div>
              <div className="sh-id">Order #{order.id}</div>
              <div className="sh-status">{statusLabel(order.status)}</div>
              {order.cod === 1 && <span className="cod-chip">💵 COD Collection</span>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="sh-amt-lbl">Order Value</div>
              <div className="sh-amt">₹{order.amount.toLocaleString('en-IN')}</div>
              {order.distance && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                  📍 {order.distance}{order.eta ? ` · ~${order.eta}` : ''}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div className="timeline-card">
            <div className="tl-title">Delivery Progress</div>
            {STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              const isLastDone = step === 'delivered' && isDelivered;
              return (
                <div className={`tl-row ${done ? 'done' : ''}`} key={step}>
                  <div className={`tl-dot ${isLastDone ? 'delivered' : done || active ? 'done' : ''} ${active && !isDelivered ? 'active' : ''}`}>
                    {stepIcon(step, done || active, active)}
                  </div>
                  <div className="tl-info">
                    <div className={`tl-lbl ${!done && !active ? 'inactive' : ''}`}>{stepLabel(step)}</div>
                    <div className="tl-time">
                      {step === 'assigned' && order.created_at ? order.created_at : ''}
                      {step === 'picked' && order.picked_at ? order.picked_at : (!done && !active ? 'Pending' : '')}
                      {step === 'delivered' && order.delivered_at ? order.delivered_at : (!done && !active ? 'Pending' : '')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Customer Info */}
        <div className="sec-card">
          <div className="sc-title">Customer</div>
          <div className="info-row">
            <div className="info-icon" style={{ background: '#eff6ff' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <div className="info-label">Name</div>
              <div className="info-value">{order.billing_name}</div>
            </div>
          </div>
          <div className="info-row">
            <div className="info-icon" style={{ background: '#f0fdf4' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 0117 1.18a2 2 0 012 2.18v3a2 2 0 01-1.67 1.94 18 18 0 00-5.8 0A2 2 0 0110 6.18" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="info-label">Phone</div>
              <div className="info-value">{order.billing_phone}</div>
            </div>
            <a href={`tel:${order.billing_phone}`} className="btn-call">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 0117 1.18a2 2 0 012 2.18v3" />
              </svg>
            </a>
          </div>
          <div className="info-row">
            <div className="info-icon" style={{ background: '#fff7ed' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <div>
              <div className="info-label">Delivery Address</div>
              <div className="info-value">{order.billing_city}</div>
              <div className="info-sub">{order.billing_address}{order.billing_pincode ? ` - ${order.billing_pincode}` : ''}</div>
            </div>
          </div>
        </div>

        {/* Pickup / Warehouse Info */}
        {order.warehouse && (
          <div className="sec-card">
            <div className="sc-title">Pickup From</div>
            <div className="info-row">
              <div className="info-icon" style={{ background: '#faf5ff' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                </svg>
              </div>
              <div>
                <div className="info-label">Warehouse</div>
                <div className="info-value">{order.warehouse.name}</div>
                {order.warehouse.address && <div className="info-sub">{order.warehouse.address}</div>}
              </div>
            </div>
            {order.warehouse.phone && (
              <div className="info-row">
                <div className="info-icon" style={{ background: '#f0fdf4' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 0117 1.18a2 2 0 012 2.18v3" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="info-label">Store Phone</div>
                  <div className="info-value">{order.warehouse.phone}</div>
                </div>
                <a href={`tel:${order.warehouse.phone}`} className="btn-call">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 0117 1.18a2 2 0 012 2.18v3" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <div className="sec-card">
            <div className="sc-title">Order Items</div>
            {order.items.map((item, i) => (
              <div className="item-row" key={i}>
                <div>
                  <div className="item-name">{item.name}</div>
                  <div className="item-qty">Qty: {item.qty}</div>
                </div>
                <div className="item-price">₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
              </div>
            ))}
            <hr className="divider" />
            {deliveryFee > 0 && (
              <div className="total-row" style={{ marginBottom: 4 }}>
                <span className="total-lbl">Subtotal</span>
                <span className="total-val">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="total-row" style={{ marginBottom: 4 }}>
                <span className="total-lbl">Delivery Fee</span>
                <span className="total-val">₹{deliveryFee.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="grand-row">
              <span className="grand-lbl">Total {order.cod ? '(COD)' : ''}</span>
              <span className="grand-val">₹{order.amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {/* Special Notes */}
        {order.notes && (
          <div className="sec-card">
            <div className="sc-title">Special Instructions</div>
            <div className="notes-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="notes-text">{order.notes}</span>
            </div>
          </div>
        )}

        {/* Spacer for fixed action bar */}
        <div style={{ height: 16 }} />

      </div>

      {/* Fixed Action Bar */}
      {!isDelivered && !isCancelled && (
        <div className="action-bar">
          <button className="btn-secondary" onClick={() => onNavigate('dashboard')}>← Back</button>
          {order.status === 'assigned' && (
            <button
              className="btn-primary"
              onClick={() => handleStatusUpdate('picked')}
              disabled={updating}
              style={{ opacity: updating ? 0.7 : 1 }}
            >
              {updating ? 'Updating…' : '📦 Mark as Picked Up'}
            </button>
          )}
          {order.status === 'picked' && (
            <button
              className="btn-primary green"
              onClick={() => handleStatusUpdate('delivered')}
              disabled={updating}
              style={{ opacity: updating ? 0.7 : 1 }}
            >
              {updating ? 'Updating…' : '✅ Mark as Delivered'}
            </button>
          )}
        </div>
      )}
      {(isDelivered || isCancelled) && (
        <div className="action-bar">
          <button className="btn-primary" style={{ background: '#1e293b' }} onClick={() => onNavigate('dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      )}
    </>
  );
};

export default OrderDetail;