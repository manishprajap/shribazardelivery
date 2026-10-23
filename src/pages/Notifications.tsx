import React, { useState, useEffect, useCallback } from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { apiGet } from '../api';

interface Props {
  onNavigate?: (page: string) => void;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  color: string;
  unread: boolean;
  type: 'order_assigned' | 'order_accepted' | 'order_picked' | 'order_delivered';
  orderId?: number | string;
}

const timeAgo = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} ago`;
  } catch { return ''; }
};

const TYPE_META = {
  order_assigned: { color: '#f97316', icon: '📦', label: 'New Order' },
  order_accepted: { color: '#3b82f6', icon: '✅', label: 'Accepted'   },
  order_picked:   { color: '#8b5cf6', icon: '🚴', label: 'Picked Up'  },
  order_delivered:{ color: '#22c55e', icon: '🎉', label: 'Delivered'  },
};

// ✅ FIX 3: build notifications from real orders
function ordersToNotifications(orders: any[]): Notification[] {
  if (!Array.isArray(orders) || orders.length === 0) return [];

  const notifs: Notification[] = [];

  orders.forEach((order) => {
    const st = String(order.dstatus ?? order.status ?? '').toLowerCase();
    const name = order.billing_name ?? order.customer_name ?? order.name ?? 'Customer';
    const city = order.billing_city ?? order.address ?? '';
    const amount = order.amount ?? 0;
    const date = order.created_at;

    if (st === 'assigned') {
      notifs.push({
        id: `assigned_${order.id}`,
        title: `New Order #${order.id} assigned!`,
        body: `${name} · ₹${amount}${city ? ' · ' + city : ''}`,
        time: timeAgo(date),
        color: TYPE_META.order_assigned.color,
        unread: true,
        type: 'order_assigned',
        orderId: order.id,
      });
    } else if (st === 'accepted') {
      notifs.push({
        id: `accepted_${order.id}`,
        title: `Order #${order.id} accepted`,
        body: `${name} · ₹${amount}`,
        time: timeAgo(date),
        color: TYPE_META.order_accepted.color,
        unread: false,
        type: 'order_accepted',
        orderId: order.id,
      });
    } else if (st === 'picked') {
      notifs.push({
        id: `picked_${order.id}`,
        title: `Order #${order.id} picked up`,
        body: `${name} · ₹${amount} · out for delivery`,
        time: timeAgo(order.picked_at ?? date),
        color: TYPE_META.order_picked.color,
        unread: true,
        type: 'order_picked',
        orderId: order.id,
      });
    } else if (st === 'delivered') {
      notifs.push({
        id: `delivered_${order.id}`,
        title: `Order #${order.id} delivered ✅`,
        body: `${name} · ₹${amount} delivered successfully`,
        time: timeAgo(order.delivered_at ?? date),
        color: TYPE_META.order_delivered.color,
        unread: false,
        type: 'order_delivered',
        orderId: order.id,
      });
    }
  });

  // Unread first, then the rest
  return notifs.sort((a, b) => {
    if (a.unread && !b.unread) return -1;
    if (!a.unread && b.unread) return 1;
    return 0;
  });
}

const NotifCard: React.FC<{ notif: Notification; onRead: (id: string) => void }> = ({ notif, onRead }) => {
  const meta = TYPE_META[notif.type];
  return (
    <div
      onClick={() => onRead(notif.id)}
      style={{
        background: '#fff',
        borderRadius: 14,
        marginBottom: 10,
        overflow: 'hidden',
        boxShadow: notif.unread ? '0 2px 12px rgba(0,0,0,0.09)' : '0 1px 4px rgba(0,0,0,0.05)',
        border: notif.unread ? `1px solid ${notif.color}33` : '1px solid #F3F4F6',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: notif.unread ? notif.color : 'transparent', borderRadius: '4px 0 0 4px' }} />
      <div style={{ padding: '14px 14px 14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: `${notif.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: notif.unread ? 700 : 500, color: '#111827', lineHeight: 1.3 }}>{notif.title}</p>
            {notif.unread && <div style={{ width: 9, height: 9, borderRadius: '50%', background: notif.color, flexShrink: 0, marginTop: 3 }} />}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280', lineHeight: 1.45 }}>{notif.body}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: notif.color, background: `${notif.color}15`, padding: '2px 8px', borderRadius: 99, letterSpacing: 0.3, textTransform: 'uppercase' }}>
              {meta.label}
            </span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{notif.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Notifications: React.FC<Props> = ({ onNavigate }) => {
  const [notifs, setNotifs]   = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // ✅ FIX 3: load real data from /delivery/orders — no mock data
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet('delivery/orders');

      let orders: any[] = [];
      if (Array.isArray(res))            orders = res;
      else if (Array.isArray(res?.data)) orders = res.data;

      if (orders.length === 0 && res?.success === false) {
        setError(res?.message ?? 'Failed to load orders.');
        return;
      }

      const generated = ordersToNotifications(orders);

      // Preserve the read state of previously loaded notifications
      setNotifs(prev => {
        const readIds = new Set(prev.filter(n => !n.unread).map(n => n.id));
        return generated.map(n => ({
          ...n,
          unread: readIds.has(n.id) ? false : n.unread,
        }));
      });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markRead    = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  const markAllRead = ()           => setNotifs(prev => prev.map(n => ({ ...n, unread: false })));

  const unreadCount = notifs.filter(n => n.unread).length;
  const unreadList  = notifs.filter(n => n.unread);
  const readList    = notifs.filter(n => !n.unread);

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#F3F4F6' } as React.CSSProperties}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', padding: '0 20px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
          <div style={{ paddingTop: 52, position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>Notifications</h1>
              {unreadCount > 0 && (
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                  You have {unreadCount} new notification{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 99, padding: '6px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Mark all read
                </button>
              )}
              <button onClick={loadNotifications} style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 99, padding: '6px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ↻
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 16px 100px' }}>

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 14 }}>
              <IonSpinner name="crescent" style={{ color: '#f97316', width: 32, height: 32 }} />
              <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>Loading…</p>
            </div>
          )}

          {!loading && error && (
            <div style={{ background: '#FEF2F2', borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <p style={{ color: '#DC2626', fontWeight: 700, margin: '0 0 8px' }}>Error</p>
              <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 14px' }}>{error}</p>
              <button onClick={loadNotifications} style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
            </div>
          )}

          {/* Unread section */}
          {!loading && !error && unreadList.length > 0 && (
            <>
              <p style={{ margin: '0 0 8px 2px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1.1, textTransform: 'uppercase' }}>New Notifications</p>
              {unreadList.map(n => <NotifCard key={n.id} notif={n} onRead={markRead} />)}
            </>
          )}

          {/* Read section */}
          {!loading && !error && readList.length > 0 && (
            <>
              <p style={{ margin: '16px 0 8px 2px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1.1, textTransform: 'uppercase' }}>Earlier Notifications</p>
              {readList.map(n => <NotifCard key={n.id} notif={n} onRead={markRead} />)}
            </>
          )}

          {/* Empty state */}
          {!loading && !error && notifs.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🔔</div>
              <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#374151' }}>No notifications</p>
              <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>You'll see it here when an order is assigned</p>
            </div>
          )}

          {/* All read */}
          {!loading && !error && notifs.length > 0 && unreadCount === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>All notifications read ✓</p>
            </div>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;