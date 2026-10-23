import React, { FC, useCallback, useEffect, useState } from 'react';
import {
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import {
  navigateOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  refreshOutline,
  locationOutline,
  timeOutline,
  personOutline,
} from 'ionicons/icons';
import { apiGet, apiPost } from '../api';
import DeliveryTrackingMap from './DeliveryTrackingMap';

// ─── Types ────────────────────────────────────────────────────
interface VendorInfo {
  name?: string;
  lat?: number | string;
  lng?: number | string;
  address?: string;
}

interface DeliveryOrder {
  id: number;
  status: string;
  dstatus: string;
  customer_name?: string;
  customer_phone?: string;
  shipping_address?: string;
  vendor_subtotal?: number;
  amount?: number;
  created_at?: string;
  warehouse_lat?: number | string;
  warehouse_lng?: number | string;
  warehouse_name?: string;
  vendor?: VendorInfo;
}

interface StatusMeta {
  label: string;
  color: string;
  bg: string;
}

interface NextStatus {
  value: string;
  label: string;
}

interface ToastState {
  open: boolean;
  msg: string;
  ok: boolean;
}

interface WarehouseCoords {
  lat: number;
  lng: number;
  label: string;
}

// ─── Status config ────────────────────────────────────────────
const DSTATUS_META: Record<string, StatusMeta> = {
  assigned:   { label: '📋 Assigned',    color: '#3B82F6', bg: '#EFF6FF' },
  accepted:   { label: '👍 Accepted',    color: '#F59E0B', bg: '#FFFBEB' },
  picked:     { label: '📦 Picked Up',   color: '#FF5722', bg: '#FFF4F0' },
  on_the_way: { label: '🛵 On the Way',  color: '#3B82F6', bg: '#EFF6FF' },
  delivered:  { label: '✅ Delivered',   color: '#22C55E', bg: '#F0FDF4' },
  cancelled:  { label: '❌ Cancelled',   color: '#EF4444', bg: '#FEF2F2' },
};

const NEXT_STATUS: Record<string, NextStatus | null> = {
  assigned:   { value: 'accepted',   label: 'Accept Order' },
  accepted:   { value: 'picked',     label: 'Confirm Pickup' },
  picked:     { value: 'on_the_way', label: 'Start Delivery' },
  on_the_way: { value: 'delivered',  label: 'Mark as Delivered' },
  delivered:  null,
  cancelled:  null,
};

function getStatusMeta(s: string): StatusMeta {
  return DSTATUS_META[s?.toLowerCase()] ?? { label: s ?? 'Pending', color: '#999', bg: '#F5F5F5' };
}

function fmtAmount(n?: number): string {
  if (!n) return '0';
  return n.toLocaleString('en-IN');
}

function formatDate(d?: string): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return d; }
}

function getWarehouseCoords(order: DeliveryOrder): WarehouseCoords | null {
  const lat = parseFloat(String(order.warehouse_lat ?? order.vendor?.lat ?? ''));
  const lng = parseFloat(String(order.warehouse_lng ?? order.vendor?.lng ?? ''));
  if (!isNaN(lat) && !isNaN(lng)) {
    return { lat, lng, label: order.warehouse_name ?? order.vendor?.name ?? 'Warehouse' };
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────
const Home: FC = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<DeliveryOrder | null>(null);
  const [toast, setToast] = useState<ToastState>({ open: false, msg: '', ok: true });

  const showToast = (msg: string, ok = true) =>
    setToast({ open: true, msg, ok });

  // ── Fetch orders ─────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: { data?: DeliveryOrder[] } & DeliveryOrder[] = await apiGet('delivery/orders');
      const list: DeliveryOrder[] = (res as { data?: DeliveryOrder[] }).data ?? (res as DeliveryOrder[]) ?? [];
      setOrders(
        Array.isArray(list)
          ? list.filter((o) => !['delivered', 'cancelled'].includes(o.dstatus ?? ''))
          : []
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load orders';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Status update ─────────────────────────────────────────────
  const updateStatus = async (order: DeliveryOrder, newStatus: string) => {
    setUpdatingId(order.id);
    try {
      await apiPost(`delivery/orders/${order.id}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, dstatus: newStatus } : o))
      );
      showToast(`Status updated: ${newStatus}`);
      if (['delivered', 'cancelled'].includes(newStatus)) {
        setTimeout(() => {
          setOrders((prev) => prev.filter((o) => o.id !== order.id));
        }, 1500);
      }
    } catch {
      showToast('Status update failed', false);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Open tracking map ─────────────────────────────────────────
  const openTracking = (order: DeliveryOrder) => {
    if (!getWarehouseCoords(order)) {
      showToast('Warehouse location is not available', false);
      return;
    }
    setTrackingOrder(order);
  };

  // ── Full-screen tracking map ──────────────────────────────────
  if (trackingOrder !== null) {
    const coords = getWarehouseCoords(trackingOrder);
    if (coords) {
      return (
        <DeliveryTrackingMap
          orderId={trackingOrder.id}
          warehouseLat={coords.lat}
          warehouseLng={coords.lng}
          warehouseLabel={coords.label}
          onClose={() => setTrackingOrder(null)}
        />
      );
    }
  }

  return (
    <IonPage>
      <IonContent scrollY>
        <div style={{ minHeight: '100vh', background: '#F8F8F6', paddingBottom: 100 }}>

          {/* ── Header ── */}
          <div style={{ background: '#1E293B', padding: '52px 20px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9' }}>
                  🛵 My Dashboard
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  {orders.length > 0
                    ? `${orders.length} active order${orders.length > 1 ? 's' : ''}`
                    : 'No active orders'}
                </div>
              </div>
              <button
                onClick={fetchOrders}
                style={{ background: '#334155', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
              >
                <IonIcon icon={refreshOutline} style={{ fontSize: 14 }} />
                Refresh
              </button>
            </div>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 12 }}>
              <IonSpinner name="crescent" color="primary" />
              <div style={{ fontSize: 13, color: '#999' }}>Loading orders…</div>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error.length > 0 && (
            <div style={{ margin: 16, background: '#FEE2E2', borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <IonIcon icon={alertCircleOutline} style={{ fontSize: 32, color: '#EF4444' }} />
              <div style={{ fontSize: 13, color: '#DC2626', marginTop: 8 }}>{error}</div>
              <button onClick={fetchOrders} style={{ marginTop: 12, background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>
                Retry
              </button>
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && error.length === 0 && orders.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: 10 }}>
              <div style={{ fontSize: 56 }}>🛵</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>No active orders</div>
              <div style={{ fontSize: 13, color: '#999' }}>New orders will appear here</div>
            </div>
          )}

          {/* ── Order cards ── */}
          {!loading && error.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
              {orders.map((order) => {
                const meta = getStatusMeta(order.dstatus);
                const next: NextStatus | null = NEXT_STATUS[order.dstatus ?? ''] ?? null;
                const coords = getWarehouseCoords(order);
                const isUpdating = updatingId === order.id;
                const canNavigate =
                  coords !== null &&
                  ['assigned', 'accepted'].includes(order.dstatus ?? '');

                return (
                  <div key={order.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.06)', border: '1px solid #F0EDE8' }}>

                    {/* Card header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 10px', borderBottom: '1px solid #F5F5F5' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>
                        Order #{order.id}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.bg, padding: '3px 10px', borderRadius: 20, border: `1px solid ${meta.color}30` }}>
                        {meta.label}
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <IonIcon icon={personOutline} style={{ fontSize: 13, color: '#999' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
                          {order.customer_name ?? '—'}
                        </span>
                        {order.customer_phone && (
                          <span style={{ fontSize: 12, color: '#666' }}>· {order.customer_phone}</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                        <IonIcon icon={locationOutline} style={{ fontSize: 13, color: '#999', marginTop: 1, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#666' }}>{order.shipping_address ?? '—'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#FF5722' }}>
                          ₹{fmtAmount(order.vendor_subtotal ?? order.amount)}
                        </span>
                        {order.created_at && (
                          <span style={{ fontSize: 11, color: '#aaa' }}>
                            <IonIcon icon={timeOutline} style={{ fontSize: 10, verticalAlign: 'middle', marginRight: 2 }} />
                            {formatDate(order.created_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Navigate button */}
                    {canNavigate && (
                      <div style={{ padding: '0 16px 10px' }}>
                        <button
                          onClick={() => openTracking(order)}
                          style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#FF5722,#FF8A50)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(255,87,34,.3)' }}
                        >
                          <IonIcon icon={navigateOutline} style={{ fontSize: 16 }} />
                          Navigate to Pickup
                          {coords && (
                            <span style={{ fontSize: 11, background: 'rgba(255,255,255,.25)', borderRadius: 6, padding: '2px 6px' }}>
                              {coords.label}
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Status update button */}
                    {next !== null && (
                      <div style={{ padding: '0 16px 16px' }}>
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStatus(order, next.value)}
                          style={{ width: '100%', padding: 11, borderRadius: 12, border: `2px solid ${meta.color}40`, background: meta.bg, color: meta.color, fontSize: 13, fontWeight: 700, cursor: isUpdating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                          {isUpdating
                            ? <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
                            : <><IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 15 }} />{next.label}</>
                          }
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </IonContent>

      <IonToast
        isOpen={toast.open}
        message={toast.msg}
        duration={2500}
        color={toast.ok ? 'success' : 'danger'}
        icon={toast.ok ? checkmarkCircleOutline : alertCircleOutline}
        onDidDismiss={() => setToast((p) => ({ ...p, open: false }))}
      />
    </IonPage>
  );
};

export default Home;