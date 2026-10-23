import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonRippleEffect,
} from '@ionic/react';
import { apiGet } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month';

interface EarningPeriod {
  base: number;
  tips: number;
  bonus: number;
  total: number;
  deliveries: number;
  label: string;
}

interface DailyEarning {
  day: string;
  amount: number;
  deliveries?: number;
}

interface CodOrder {
  id: string;
  customer: string;
  amount: number;
  status: string;
  cod: boolean;
}

interface WalletInfo {
  balance: number;
  next_payout?: string;
}

interface EarningsApiResponse {
  today?: Partial<EarningPeriod>;
  week?: Partial<EarningPeriod>;
  month?: Partial<EarningPeriod>;
  daily_earnings?: DailyEarning[];
  weekly_earnings?: DailyEarning[];
  cod_orders?: CodOrder[];
  wallet?: WalletInfo;
  wallet_balance?: number;
  next_payout?: string;
  // flat structure fallback
  base_pay?: number;
  tips?: number;
  bonus?: number;
  total_earnings?: number;
  total_deliveries?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const safeN = (v: unknown, fallback = 0): number =>
  typeof v === 'number' ? v : parseFloat(String(v)) || fallback;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Build consistent period data from any API shape
function buildPeriod(raw: EarningsApiResponse | null, period: Period): EarningPeriod {
  if (!raw) return { base: 0, tips: 0, bonus: 0, total: 0, deliveries: 0, label: '' };

  const nested = raw[period] as Partial<EarningPeriod> | undefined;
  const base      = safeN(nested?.base      ?? raw.base_pay);
  const tips      = safeN(nested?.tips      ?? raw.tips);
  const bonus     = safeN(nested?.bonus     ?? raw.bonus);
  const total     = safeN(nested?.total     ?? raw.total_earnings ?? (base + tips + bonus));
  const deliveries = safeN(nested?.deliveries ?? raw.total_deliveries);

  const labels: Record<Period, string> = {
    today: "Today",
    week:  "This Week",
    month: "This Month",
  };

  return { base, tips, bonus, total, deliveries, label: labels[period] };
}

function buildDaily(raw: EarningsApiResponse | null): DailyEarning[] {
  const src = raw?.weekly_earnings ?? raw?.daily_earnings;
  if (src && src.length > 0) return src;
  // Fallback: zeros for the week
  return DAYS.map(day => ({ day, amount: 0 }));
}

function buildCod(raw: EarningsApiResponse | null): CodOrder[] {
  return raw?.cod_orders?.filter(o => o.cod) ?? [];
}

function buildWallet(raw: EarningsApiResponse | null): WalletInfo {
  if (raw?.wallet) return raw.wallet;
  return {
    balance: safeN(raw?.wallet_balance),
    next_payout: raw?.next_payout ?? 'Monday',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const Earnings: React.FC = () => {
  const [period, setPeriod]   = useState<Period>('week');
  const [data, setData]       = useState<EarningsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToastMsg({ msg, ok });
    setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const loadEarnings = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiGet('delivery/earnings');
      // Accept either top-level data or flat
      const payload: EarningsApiResponse = res?.data ?? res;
      if (payload && typeof payload === 'object') {
        setData(payload);
      } else {
        setError(res?.message ?? 'Earnings load nahi ho saka.');
      }
    } catch {
      setError('Network error. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEarnings(); }, [loadEarnings]);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const res = await apiGet('delivery/withdraw');
      showToast(res?.message ?? 'Withdrawal request bheji gayi ✓');
    } catch {
      showToast('Withdrawal failed', false);
    } finally {
      setWithdrawing(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const cur    = buildPeriod(data, period);
  const daily  = buildDaily(data);
  const cod    = buildCod(data);
  const wallet = buildWallet(data);
  const maxAmt = Math.max(...daily.map(d => d.amount), 1);

  const codCollected = cod.filter(o => o.status === 'delivered').reduce((s, o) => s + o.amount, 0);
  const codPending   = cod.filter(o => o.status !== 'delivered').reduce((s, o) => s + o.amount, 0);

  const periodDateLabel: Record<Period, string> = {
    today: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
    week:  'Mon – Sun, this week',
    month: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <IonPage>
      <IonContent
        fullscreen
        style={{ '--background': '#F0F2F7' } as React.CSSProperties}
      >
        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <div style={{
          background: 'linear-gradient(145deg, #0A3526 0%, #0F6B47 55%, #1aab6d 100%)',
          padding: '0 20px 72px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: loading ? 200 : undefined,
        }}>
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          {/* Top bar */}
          <div style={{ paddingTop: 52, paddingBottom: 20, position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Earnings</span>
            {!loading && !error && (
              <button
                onClick={loadEarnings}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 99, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ↻ Refresh
              </button>
            )}
          </div>

          {/* Period Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24, position: 'relative', zIndex: 2 }}>
            {(['today', 'week', 'month'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10,
                  border: period === p ? '1.5px solid rgba(255,255,255,0.5)' : '1.5px solid rgba(255,255,255,0.15)',
                  background: period === p ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)',
                  color: period === p ? '#fff' : 'rgba(255,255,255,0.55)',
                  fontSize: 12, fontWeight: period === p ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                  letterSpacing: 0.3, textTransform: 'capitalize',
                }}
              >
                {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          {/* Hero total */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 20, position: 'relative', zIndex: 2 }}>
              <IonSpinner name="crescent" style={{ color: '#fff', width: 32, height: 32 }} />
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 10 }}>Loading earnings…</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                Total Earnings
              </p>
              <p style={{ margin: '0 0 4px', fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: -1 }}>
                {fmt(cur.total)}
              </p>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {periodDateLabel[period]}
              </p>
              {/* Mini stats row in hero */}
              <div style={{ display: 'inline-flex', gap: 20, background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>{cur.deliveries}</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Orders</p>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>{fmt(cur.tips)}</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Tips</p>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>{fmt(cur.bonus)}</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Bonus</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══ ERROR ════════════════════════════════════════════════════════ */}
        {!loading && error && (
          <div style={{ padding: 20, marginTop: 16 }}>
            <div style={{ background: '#FEF2F2', borderRadius: 16, padding: 20 }}>
              <p style={{ color: '#EF4444', fontWeight: 700, fontSize: 15, margin: '0 0 8px' }}>Error</p>
              <p style={{ color: '#64748B', fontSize: 13, margin: '0 0 16px' }}>{error}</p>
              <button onClick={loadEarnings} style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ══ BODY ══════════════════════════════════════════════════════════ */}
        {!loading && !error && data && (
          <div style={{ paddingBottom: 100 }}>

            {/* ── Wallet Card (overlaps hero) ── */}
            <div style={{
              background: '#fff', borderRadius: 20,
              margin: '-40px 16px 0',
              padding: '18px 20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              position: 'relative', zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' }}>Wallet Balance</span>
                </div>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0A3526', letterSpacing: -0.5 }}>
                  {fmt(wallet.balance)}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94A3B8' }}>
                  Next payout: <span style={{ color: '#0F6B47', fontWeight: 600 }}>{wallet.next_payout ?? 'Monday'}</span>
                </p>
              </div>
              <button
                className="ion-activatable"
                onClick={handleWithdraw}
                disabled={withdrawing || wallet.balance <= 0}
                style={{
                  position: 'relative', overflow: 'hidden',
                  background: wallet.balance > 0 ? 'linear-gradient(135deg, #0F6B47, #1aab6d)' : '#E2E8F0',
                  color: wallet.balance > 0 ? '#fff' : '#94A3B8',
                  border: 'none', borderRadius: 12,
                  padding: '10px 18px', fontSize: 13, fontWeight: 700,
                  cursor: wallet.balance > 0 ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {withdrawing && <IonSpinner name="crescent" style={{ width: 13, height: 13 }} />}
                {withdrawing ? 'Processing…' : '↑ Withdraw'}
                <IonRippleEffect />
              </button>
            </div>

            {/* ── Breakdown ── */}
            <div style={{ margin: '20px 16px 0' }}>
              <p style={{ margin: '0 0 10px 4px', fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Earnings Breakdown
              </p>
              <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                {[
                  { label: 'Base Pay', sub: '₹40 per delivery', value: fmt(cur.base), color: '#1E293B', iconBg: '#EFF6FF', icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  )},
                  { label: 'Tips', sub: 'Customer appreciation', value: `+${fmt(cur.tips)}`, color: '#10B981', iconBg: '#ECFDF5', icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                  )},
                  { label: 'Bonus', sub: 'Target achievements', value: `+${fmt(cur.bonus)}`, color: '#F59E0B', iconBg: '#FFFBEB', icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  )},
                ].map((row, i) => (
                  <div key={row.label} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    borderBottom: i < 2 ? '1px solid #F8FAFC' : 'none',
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: row.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {row.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#1E293B' }}>{row.label}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{row.sub}</p>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: row.color }}>{row.value}</span>
                  </div>
                ))}
                {/* Total row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1.5px solid #F1F5F9', background: '#FAFBFC' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#0A3526' }}>{fmt(cur.total)}</span>
                </div>
              </div>
            </div>

            {/* ── Weekly Bar Chart ── */}
            {period === 'week' && (
              <div style={{ margin: '20px 16px 0' }}>
                <p style={{ margin: '0 0 10px 4px', fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                  Daily Breakdown
                </p>
                <div style={{ background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  {/* Bar chart */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, marginBottom: 8 }}>
                    {daily.map((d, i) => {
                      const pct = maxAmt > 0 ? (d.amount / maxAmt) : 0;
                      const isToday = i === daily.length - 1;
                      return (
                        <div key={d.day || i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                          {d.amount > 0 && (
                            <span style={{ fontSize: 9, color: isToday ? '#0A3526' : '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              ₹{d.amount >= 1000 ? (d.amount / 1000).toFixed(1) + 'k' : d.amount}
                            </span>
                          )}
                          <div style={{
                            width: '100%',
                            height: `${Math.max(pct * 70, d.amount > 0 ? 8 : 3)}px`,
                            borderRadius: '5px 5px 0 0',
                            background: isToday
                              ? 'linear-gradient(180deg, #1aab6d, #0A3526)'
                              : '#E2F5EC',
                            transition: 'height .4s ease',
                          }} />
                        </div>
                      );
                    })}
                  </div>
                  {/* Day labels */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {daily.map((d, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <span style={{
                          fontSize: 10, fontWeight: i === daily.length - 1 ? 700 : 500,
                          color: i === daily.length - 1 ? '#0A3526' : '#94A3B8',
                        }}>
                          {(d.day || DAYS[i] || '').slice(0, 3)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── COD Collections ── */}
            {cod.length > 0 && (
              <div style={{ margin: '20px 16px 0' }}>
                <p style={{ margin: '0 0 10px 4px', fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                  COD Collections
                </p>
                <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  {cod.map((o, i) => {
                    const collected = o.status === 'delivered';
                    return (
                      <div key={o.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 16px',
                        borderBottom: i < cod.length - 1 ? '1px solid #F8FAFC' : 'none',
                      }}>
                        {/* Status dot */}
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                          background: collected ? '#10B981' : '#F59E0B',
                          boxShadow: collected ? '0 0 0 3px #ECFDF5' : '0 0 0 3px #FFFBEB',
                        }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0A3526', fontFamily: 'monospace' }}>{o.id}</p>
                          <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{o.customer}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{fmt(o.amount)}</p>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: collected ? '#10B981' : '#F59E0B', marginTop: 1 }}>
                            {collected ? '✓ Collected' : '⏳ Pending'}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary footer */}
                  <div style={{ background: '#FAFBFC', padding: '12px 16px', borderTop: '1.5px solid #F1F5F9', display: 'flex', gap: 0 }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 3 }}>Collected</p>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#10B981' }}>{fmt(codCollected)}</p>
                    </div>
                    <div style={{ width: 1, background: '#E2E8F0', margin: '4px 0' }} />
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 3 }}>Pending</p>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#F59E0B' }}>{fmt(codPending)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── No COD ── */}
            {cod.length === 0 && (
              <div style={{ margin: '20px 16px 0' }}>
                <div style={{ background: '#fff', borderRadius: 16, padding: '20px 16px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>No COD orders for this period</p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Toast ── */}
        {toastMsg && (
          <div style={{
            position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            background: toastMsg.ok ? '#0A3526' : '#EF4444',
            color: '#fff', padding: '11px 24px', borderRadius: 99,
            fontSize: 13, fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 9999, whiteSpace: 'nowrap',
          }}>
            {toastMsg.msg}
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default Earnings;