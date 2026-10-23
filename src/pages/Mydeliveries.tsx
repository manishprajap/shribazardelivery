import React, { useState, useEffect, useCallback } from 'react';
import {
    IonPage,
    IonContent,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonRippleEffect,
} from '@ionic/react';
import { apiGet } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
    id?: number | string;
    name?: string;
    product_name?: string;
    qty?: number;
    quantity?: number;
    price?: number | string;
}

interface DeliveryOrder {
    id: number | string;
    order_number?: string;
    order_id?: string;
    customer_name?: string;
    customer?: string;
    address?: string;
    delivery_address?: string;
    status?: string;
    delivery_status?: string;
    total?: number | string;
    amount?: number | string;
    items?: OrderItem[];
    items_count?: number;
    created_at?: string;
    delivered_at?: string;
    assigned_at?: string;
    payment_method?: string;
    payment_status?: string;
    phone?: string;
    mobile?: string;
    store_status?: string;
}

type FilterTab = 'all' | 'delivered' | 'processing' | 'cancelled';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safe = (val: string | number | undefined | null, fallback = '—') =>
    val !== undefined && val !== null && String(val).trim() !== ''
        ? String(val)
        : fallback;

const formatDate = (str?: string) => {
    if (!str) return '—';
    try {
        return new Date(str).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    } catch { return str; }
};

const formatTime = (str?: string) => {
    if (!str) return '';
    try {
        return new Date(str).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    } catch { return ''; }
};

const getStatusMeta = (status?: string) => {
    const s = (status ?? '').toLowerCase();
    if (s.includes('deliver'))
        return { label: 'DELIVERED', dot: '#22C55E', color: '#16A34A', bg: '#F0FDF4' };
    if (s.includes('cancel'))
        return { label: 'CANCELLED', dot: '#EF4444', color: '#DC2626', bg: '#FEF2F2' };
    if (s.includes('transit') || s.includes('picked'))
        return { label: 'IN TRANSIT', dot: '#F97316', color: '#EA580C', bg: '#FFF7ED' };
    if (s.includes('accept'))
        return { label: 'ACCEPTED', dot: '#3B82F6', color: '#2563EB', bg: '#EFF6FF' };
    return { label: 'PROCESSING', dot: '#F97316', color: '#EA580C', bg: '#FFF7ED' };
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const PinIcon: React.FC<{ color?: string }> = ({ color = '#F97316' }) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
);

const BoxIcon: React.FC<{ color?: string; size?: number }> = ({ color = '#F97316', size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
);

const SearchIcon: React.FC = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const TruckIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#fff' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 4v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
);

const CheckIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#fff' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const RupeeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = '#fff' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
        <path d="M6 3h12M6 8h12M6 13l8 8M6 13h3a6 6 0 000-10" />
    </svg>
);

// ─── Order Card ───────────────────────────────────────────────────────────────

const OrderCard: React.FC<{ order: DeliveryOrder; onClick: () => void }> = ({ order, onClick }) => {
    const status = getStatusMeta(order.status ?? order.delivery_status);
    const orderNo = safe(order.order_number ?? order.order_id ?? order.id);
    const customer = safe(order.customer_name ?? order.customer, 'Customer');
    const address = safe(order.address ?? order.delivery_address);
    const amount = safe(order.total ?? order.amount, '0');
    const phone = safe(order.phone ?? order.mobile);
    const storeStatus = order.store_status ?? 'Ready at store';

    return (
        <div
            className="ion-activatable"
            onClick={onClick}
            style={{
                background: '#fff',
                borderRadius: 14,
                marginBottom: 12,
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                position: 'relative',
                cursor: 'pointer',
                border: '1px solid #F3F4F6',
            }}
        >
            {/* Left accent bar — exactly like screenshot */}
            <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: 4, background: status.dot,
            }} />

            <div style={{ padding: '14px 14px 12px 18px' }}>
                {/* Row 1: order# left, amount right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280' }}>#{orderNo}</span>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#111827' }}>₹{amount}</p>
                </div>

                {/* Row 2: customer name + status badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>{customer}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: status.dot }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: status.color, letterSpacing: 0.3 }}>{status.label}</span>
                    </div>
                </div>

                {/* Phone */}
                {phone !== '—' && (
                    <p style={{ margin: '0 0 8px', fontSize: 12, color: '#9CA3AF' }}>{phone}</p>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: '#F3F4F6', margin: '8px 0' }} />

                {/* Address */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 4 }}>
                    <div style={{ marginTop: 1 }}><PinIcon /></div>
                    <p style={{
                        margin: 0, fontSize: 12, color: '#6B7280', lineHeight: 1.45,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {address}
                    </p>
                </div>

                {/* Store status */}
                <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{storeStatus}</p>
            </div>

            <IonRippleEffect />
        </div>
    );
};

// ─── Detail Bottom Sheet ──────────────────────────────────────────────────────

const DetailSheet: React.FC<{ order: DeliveryOrder | null; onClose: () => void }> = ({ order, onClose }) => {
    if (!order) return null;
    const status = getStatusMeta(order.status ?? order.delivery_status);
    const orderNo = safe(order.order_number ?? order.order_id ?? order.id);
    const customer = safe(order.customer_name ?? order.customer, 'Customer');
    const address = safe(order.address ?? order.delivery_address);
    const amount = safe(order.total ?? order.amount, '0');
    const payment = safe(order.payment_method, 'COD');
    const payStatus = safe(order.payment_status, 'Pending');
    const phone = safe(order.phone ?? order.mobile);
    const date = order.delivered_at ?? order.created_at ?? order.assigned_at;

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'flex-end',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                width: '100%', background: '#fff',
                borderRadius: '22px 22px 0 0',
                maxHeight: '86vh', overflowY: 'auto',
            }}>
                {/* Drag handle */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
                    <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E5E7EB' }} />
                </div>

                {/* Orange banner */}
                <div style={{
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    margin: '14px 16px 0', borderRadius: 16, padding: '18px 18px 16px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ margin: '0 0 3px', fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: 0.8 }}>ORDER NUMBER</p>
                            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>#{orderNo}</h2>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.22)', borderRadius: 99,
                            padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>{status.label}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 10px',
                            display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                            <RupeeIcon size={13} />
                            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>₹{amount}</span>
                        </div>
                        <span style={{
                            fontSize: 11, background: 'rgba(255,255,255,0.2)',
                            color: '#fff', padding: '4px 10px', borderRadius: 99, fontWeight: 600,
                        }}>
                            {payment}
                        </span>
                        <span style={{
                            fontSize: 11,
                            background: payStatus.toLowerCase() === 'paid' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)',
                            color: '#fff', padding: '4px 10px', borderRadius: 99, fontWeight: 600,
                        }}>
                            {payStatus}
                        </span>
                    </div>
                </div>

                <div style={{ padding: '14px 16px 40px' }}>
                    {/* Customer block */}
                    <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                        <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8, textTransform: 'uppercase' }}>Customer</p>
                        <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: '#111827' }}>{customer}</p>
                        {phone !== '—' && <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6B7280' }}>{phone}</p>}
                        {address !== '—' && (
                            <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                                <PinIcon color="#F97316" />
                                <p style={{ margin: 0, fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{address}</p>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    {order.items && order.items.length > 0 && (
                        <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                            <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                                Items ({order.items.length})
                            </p>
                            {order.items.map((item, i) => (
                                <div key={item.id ?? i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '8px 0',
                                    borderBottom: i < order.items!.length - 1 ? '1px solid #E5E7EB' : 'none',
                                }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <div style={{
                                            width: 30, height: 30, borderRadius: 8,
                                            background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <BoxIcon color="#F97316" size={14} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.name ?? item.product_name ?? 'Item'}</p>
                                            <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>Qty: {item.qty ?? item.quantity ?? 1}</p>
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#374151' }}>₹{safe(item.price)}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Timeline */}
                    <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 14 }}>
                        <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8, textTransform: 'uppercase' }}>Timeline</p>
                        {[
                            { label: 'Assigned', val: order.assigned_at ?? order.created_at },
                            { label: 'Delivered', val: order.delivered_at },
                        ].filter(t => t.val).map(t => (
                            <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, color: '#6B7280' }}>{t.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                                    {formatDate(t.val)} {formatTime(t.val)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MyDeliveries: React.FC = () => {
    const [orders, setOrders] = useState<DeliveryOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [selected, setSelected] = useState<DeliveryOrder | null>(null);
    const [search, setSearch] = useState('');

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGet('delivery/orders');

            // ✅ Handle both: {success, data: [...]} OR direct array
            let data: DeliveryOrder[] = [];
            if (Array.isArray(res)) {
                data = res;
            } else if (res?.data && Array.isArray(res.data)) {
                data = res.data;
            } else if (res?.success === false) {
                setError(res?.message ?? 'Orders load nahi ho sake.');
                return;
            }

            setOrders(data);
        } catch (err) {
            setError('Network error. Please retry.');
        } finally {
            setLoading(false);   // ✅ Hamesha false hoga chahe kuch bhi ho
        }
    }, []);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const handleRefresh = async (e: CustomEvent) => {
        await loadOrders();
        (e.detail as any).complete();
    };

    // ── Counts ────────────────────────────────────────────────────────────────
    const deliveredCount = orders.filter(o => (o.status ?? '').toLowerCase().includes('deliver')).length;
    const processingCount = orders.filter(o => {
        const s = (o.status ?? '').toLowerCase();
        return !s.includes('deliver') && !s.includes('cancel');
    }).length;
    const cancelledCount = orders.filter(o => (o.status ?? '').toLowerCase().includes('cancel')).length;
    const totalAmt = orders
        .filter(o => (o.status ?? '').toLowerCase().includes('deliver'))
        .reduce((sum, o) => sum + parseFloat(String(o.total ?? o.amount ?? 0)), 0);

    // ── Filter ────────────────────────────────────────────────────────────────
    const filtered = orders.filter(o => {
        const s = (o.status ?? o.delivery_status ?? '').toLowerCase();
        const tabOk =
            activeTab === 'all' ? true :
                activeTab === 'delivered' ? s.includes('deliver') :
                    activeTab === 'processing' ? (!s.includes('deliver') && !s.includes('cancel')) :
                        activeTab === 'cancelled' ? s.includes('cancel') : true;

        const q = search.trim().toLowerCase();
        const searchOk = !q ||
            String(o.order_number ?? o.order_id ?? o.id).toLowerCase().includes(q) ||
            (o.customer_name ?? o.customer ?? '').toLowerCase().includes(q) ||
            (o.address ?? o.delivery_address ?? '').toLowerCase().includes(q);

        return tabOk && searchOk;
    });

    const TABS: { key: FilterTab; label: string; count: number }[] = [
        { key: 'all', label: 'All Orders', count: orders.length },
        { key: 'delivered', label: 'Delivered', count: deliveredCount },
        { key: 'processing', label: 'Processing', count: processingCount },
        { key: 'cancelled', label: 'Cancelled', count: cancelledCount },
    ];

    return (
        <IonPage>
            <IonContent fullscreen style={{ '--background': '#F3F4F6' } as React.CSSProperties}>
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent />
                </IonRefresher>

                {/* ── Orange Header ─────────────────────────────────────────────── */}
                <div style={{
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    padding: '0 20px 28px',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* Decorative circles — same as dashboard */}
                    <div style={{
                        position: 'absolute', top: -50, right: -50,
                        width: 180, height: 180, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: -30, left: -20,
                        width: 120, height: 120, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
                    }} />

                    {/* Title */}
                    <div style={{
                        paddingTop: 50, paddingBottom: 20,
                        position: 'relative', zIndex: 2,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>My Deliveries</h1>
                        <div style={{
                            background: 'rgba(255,255,255,0.18)', borderRadius: 99,
                            padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                            <TruckIcon size={14} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>All History</span>
                        </div>
                    </div>

                    {/* 3 stat boxes — matching dashboard card style */}
                    {!loading && !error && (
                        <div style={{ display: 'flex', gap: 10, position: 'relative', zIndex: 2 }}>
                            {[
                                {
                                    val: orders.length,
                                    label: 'Total Orders',
                                    icon: <BoxIcon color="#fff" size={16} />,
                                },
                                {
                                    val: deliveredCount,
                                    label: 'Delivered today',
                                    icon: <CheckIcon size={16} />,
                                },
                                {
                                    val: `₹${Math.round(totalAmt)}`,
                                    label: 'COD collected',
                                    icon: <RupeeIcon size={13} />,
                                },
                            ].map((s, i) => (
                                <div key={i} style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.18)',
                                    borderRadius: 12, padding: '12px 8px',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    textAlign: 'center',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{s.icon}</div>
                                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.val}</p>
                                    <p style={{ margin: '5px 0 0', fontSize: 9, color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Search ────────────────────────────────────────────────────── */}
                <div style={{ padding: '14px 16px 0' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: '#fff', borderRadius: 12, padding: '10px 14px',
                        boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                    }}>
                        <SearchIcon />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Order no, customer, address..."
                            style={{
                                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                                fontSize: 13, color: '#374151', fontFamily: 'inherit',
                            }}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} style={{
                                border: 'none', background: 'none', cursor: 'pointer',
                                color: '#9CA3AF', fontSize: 18, lineHeight: 1, padding: 0,
                            }}>×</button>
                        )}
                    </div>
                </div>

                {/* ── Filter Tabs ───────────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', gap: 8, padding: '12px 16px 0',
                    overflowX: 'auto', scrollbarWidth: 'none',
                }}>
                    {TABS.map(tab => {
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    flexShrink: 0, border: 'none', cursor: 'pointer',
                                    padding: '7px 14px', borderRadius: 99, fontFamily: 'inherit',
                                    fontSize: 12, fontWeight: 700,
                                    background: active ? '#F97316' : '#fff',
                                    color: active ? '#fff' : '#6B7280',
                                    boxShadow: active
                                        ? '0 4px 12px rgba(249,115,22,0.35)'
                                        : '0 1px 4px rgba(0,0,0,0.06)',
                                    transition: 'all .2s',
                                    display: 'flex', alignItems: 'center', gap: 5,
                                }}
                            >
                                {tab.label}
                                <span style={{
                                    fontSize: 10, fontWeight: 700,
                                    background: active ? 'rgba(255,255,255,0.3)' : '#F3F4F6',
                                    color: active ? '#fff' : '#9CA3AF',
                                    padding: '1px 6px', borderRadius: 99,
                                }}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Order List ────────────────────────────────────────────────── */}
                <div style={{ padding: '14px 16px 100px' }}>

                    {/* Section label */}
                    {!loading && !error && filtered.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                                {TABS.find(t => t.key === activeTab)?.label}
                            </span>
                            <span style={{ fontSize: 13, color: '#F97316', fontWeight: 600 }}>
                                {filtered.length} orders
                            </span>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 14 }}>
                            <IonSpinner name="crescent" style={{ color: '#F97316', width: 36, height: 36 }} />
                            <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>Orders load ho rahe hain…</p>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div style={{ background: '#FEF2F2', borderRadius: 14, padding: 20, textAlign: 'center' }}>
                            <p style={{ color: '#DC2626', fontWeight: 700, margin: '0 0 8px' }}>Error</p>
                            <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 14px' }}>{error}</p>
                            <button onClick={loadOrders} style={{
                                background: '#F97316', color: '#fff', border: 'none',
                                borderRadius: 10, padding: '9px 24px',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                Dobara Try Karein
                            </button>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !error && filtered.length === 0 && (
                        <div style={{ textAlign: 'center', paddingTop: 60 }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%', background: '#FFF7ED',
                                margin: '0 auto 16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <BoxIcon color="#FBB97C" size={32} />
                            </div>
                            <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#374151' }}>
                                {search ? 'Koi result nahi mila' : 'Koi order nahi'}
                            </p>
                            <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>
                                {search ? 'Alag search try karein' : 'Is category mein abhi koi order nahi hai'}
                            </p>
                        </div>
                    )}

                    {/* Cards */}
                    {!loading && !error && filtered.map(order => (
                        <OrderCard key={order.id} order={order} onClick={() => setSelected(order)} />
                    ))}
                </div>

                {/* Detail sheet */}
                <DetailSheet order={selected} onClose={() => setSelected(null)} />

            </IonContent>
        </IonPage>
    );
};

export default MyDeliveries;