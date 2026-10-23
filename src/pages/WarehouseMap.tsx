import React, { useState, useEffect } from 'react';
import { apiPost } from '../api'; // ← your existing api.ts

interface WarehouseMapProps {
  warehouseLat: number;
  warehouseLng: number;
  warehouseName?: string;
  orderId: number;           // ← pass the ORDER ID (used for the DB update)
  onBack: () => void;
  onStatusChange?: (status: 'picked_up' | 'on_the_way') => void;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  :root {
    --orange: #f97316; --orange-dark: #ea6c05;
    --green: #16a34a; --green-light: #dcfce7; --green-border: #86efac;
    --blue: #2563eb;
    --t1: #1e293b; --t2: #64748b; --t3: #94a3b8;
    --bg: #f8fafc; --white: #ffffff; --border: #f0f0f0;
    --font: 'DM Sans', sans-serif; --mono: 'DM Mono', monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .rm-root { font-family: var(--font); background: var(--bg); min-height: 100vh; display: flex; flex-direction: column; }

  .rm-topbar {
    display: flex; align-items: center; gap: 10px; padding: 13px 15px;
    background: var(--white); border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 10; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .rm-back-btn {
    width: 36px; height: 36px; border-radius: 9px; background: var(--bg);
    border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0; transition: background 0.15s;
  }
  .rm-back-btn:hover { background: #f1f5f9; }
  .rm-topbar-info { flex: 1; min-width: 0; }
  .rm-topbar-title { font-size: 14px; font-weight: 700; color: var(--t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rm-topbar-sub { font-size: 11px; color: var(--t3); font-family: var(--mono); margin-top: 1px; }
  .rm-status-pill { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 99px; flex-shrink: 0; }
  .rm-status-pill.pickup { background: #fff7ed; color: var(--orange); border: 1px solid #fed7aa; }
  .rm-status-pill.otw    { background: var(--green-light); color: var(--green); border: 1px solid var(--green-border); }

  .rm-map-wrap { position: relative; flex: 1; min-height: 340px; }
  .rm-map-wrap iframe { width: 100%; height: 100%; min-height: 340px; border: none; display: block; }

  .rm-loc-badge {
    position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.96);
    border-radius: 8px; padding: 6px 10px; display: flex; align-items: center; gap: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.13); font-size: 11px; font-weight: 600; color: var(--t1); backdrop-filter: blur(6px);
  }
  .rm-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: livePulse 1.5s ease-in-out infinite; flex-shrink: 0; }
  @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }

  .rm-eta-card {
    position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
    background: rgba(255,255,255,0.97); border-radius: 14px; padding: 10px 18px;
    display: flex; align-items: center; gap: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    backdrop-filter: blur(8px); white-space: nowrap; min-width: 200px; justify-content: center;
  }
  .rm-eta-item { display: flex; flex-direction: column; align-items: center; gap: 1px; }
  .rm-eta-val { font-size: 17px; font-weight: 800; color: var(--t1); }
  .rm-eta-lbl { font-size: 10px; color: var(--t3); font-family: var(--mono); }
  .rm-eta-divider { width: 1px; height: 30px; background: #e2e8f0; }

  .rm-locating {
    position: absolute; inset: 0; background: rgba(248,250,252,0.85);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; font-size: 13px; color: var(--t2); font-weight: 600; backdrop-filter: blur(3px);
  }
  .rm-spin { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: var(--orange); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .rm-strip { background: var(--white); border-top: 1px solid var(--border); padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
  .rm-strip-icon { width: 34px; height: 34px; border-radius: 9px; background: #FFF7ED; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rm-strip-text { flex: 1; min-width: 0; }
  .rm-strip-title { font-size: 13px; font-weight: 700; color: var(--t1); }
  .rm-strip-sub { font-size: 11px; color: var(--t3); font-family: var(--mono); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .rm-banner {
    margin: 8px 14px 0; border-radius: 12px; padding: 10px 14px;
    display: flex; align-items: center; gap: 10px; animation: fadeSlideIn 0.35s ease;
  }
  .rm-banner.pickup { background: #fff7ed; border: 1px solid #fed7aa; }
  .rm-banner.otw    { background: var(--green-light); border: 1px solid var(--green-border); }
  @keyframes fadeSlideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  .rm-banner-icon { font-size: 20px; flex-shrink: 0; animation: truckMove 1.2s ease-in-out infinite alternate; }
  @keyframes truckMove { from{transform:translateX(0)} to{transform:translateX(4px)} }
  .rm-banner-text { flex: 1; }
  .rm-banner-title { font-size: 13px; font-weight: 700; }
  .rm-banner-title.pickup { color: var(--orange); }
  .rm-banner-title.otw    { color: var(--green); }
  .rm-banner-sub { font-size: 11px; color: var(--t2); margin-top: 1px; }
  .rm-banner-badge { font-size: 10px; font-weight: 700; color: #fff; padding: 3px 8px; border-radius: 99px; white-space: nowrap; }
  .rm-banner-badge.pickup { background: var(--orange); }
  .rm-banner-badge.otw    { background: var(--green); }

  .rm-btns {
    display: flex; gap: 8px; padding: 12px 14px;
    background: var(--white); border-top: 1px solid var(--border);
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  }

  .rm-btn-pickup {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
    background: var(--blue); color: #fff; border: none; border-radius: 11px; padding: 13px;
    font-size: 13px; font-weight: 700; font-family: var(--font); cursor: pointer;
    transition: background 0.15s, transform 0.1s; -webkit-tap-highlight-color: transparent;
    animation: popIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  .rm-btn-pickup:active { background: #1d4ed8; transform: scale(0.98); }
  .rm-btn-pickup:disabled { background: #93c5fd; cursor: not-allowed; }

  .rm-btn-otw {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
    background: var(--green); color: #fff; border: none; border-radius: 11px; padding: 13px;
    font-size: 13px; font-weight: 700; font-family: var(--font); cursor: pointer;
    transition: background 0.15s, transform 0.1s; -webkit-tap-highlight-color: transparent;
    animation: popIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  .rm-btn-otw:active { background: #15803d; transform: scale(0.98); }
  .rm-btn-otw:disabled { background: #86efac; cursor: default; transform: none; }

  @keyframes popIn { from{transform:scale(0.85);opacity:0} to{transform:scale(1);opacity:1} }

  .rm-btn-navigate {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
    background: var(--orange); color: #fff; border: none; border-radius: 11px; padding: 13px;
    font-size: 13px; font-weight: 700; font-family: var(--font); cursor: pointer; text-decoration: none;
    transition: background 0.15s, transform 0.1s; -webkit-tap-highlight-color: transparent;
  }
  .rm-btn-navigate:active { background: var(--orange-dark); transform: scale(0.98); }

  .rm-btn-copy {
    width: 46px; height: 46px; border-radius: 11px; background: var(--bg); border: 1px solid #e2e8f0;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0; transition: background 0.15s; -webkit-tap-highlight-color: transparent;
  }
  .rm-btn-copy:hover { background: #f1f5f9; }

  /* Loading spinner overlay for API calls */
  .rm-btn-loading { opacity: 0.7; pointer-events: none; }
  .rm-btn-spinner {
    width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite;
  }

  .rm-toast {
    position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%) translateY(10px);
    background: #1e293b; color: #fff; padding: 8px 16px; border-radius: 99px;
    font-size: 12px; font-weight: 600; font-family: var(--font);
    opacity: 0; transition: opacity 0.2s, transform 0.2s;
    pointer-events: none; white-space: nowrap; z-index: 999;
  }
  .rm-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  .rm-toast.error { background: #dc2626; }
`;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function formatDist(km: number) { return km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`; }
function formatETA(km: number) { const m = Math.round((km/30)*60); return m < 60 ? `${m} min` : `${Math.floor(m/60)} hr ${m%60} min`; }

type DeliveryStatus = 'pending' | 'picked_up' | 'on_the_way';

const WarehouseMap: React.FC<WarehouseMapProps> = ({
  warehouseLat, warehouseLng, warehouseName,
  orderId,
  onBack, onStatusChange,
}) => {
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(true);
  const [locErr, setLocErr] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastError, setToastError] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('pending');
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); setLocErr(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMyLat(pos.coords.latitude); setMyLng(pos.coords.longitude); setLocating(false); },
      (err) => { setLocating(false); setLocErr(true); if (err.code === 1) setPermissionDenied(true); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const embedUrl = myLat && myLng
    ? `https://maps.google.com/maps?saddr=${myLat},${myLng}&daddr=${warehouseLat},${warehouseLng}&output=embed`
    : `https://maps.google.com/maps?q=${warehouseLat},${warehouseLng}&z=15&output=embed`;
  const navUrl = myLat && myLng
    ? `https://www.google.com/maps/dir/?api=1&origin=${myLat},${myLng}&destination=${warehouseLat},${warehouseLng}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${warehouseLat},${warehouseLng}&travelmode=driving`;
  const distKm = myLat && myLng ? haversine(myLat, myLng, warehouseLat, warehouseLng) : null;

  const toast = (msg: string, isError = false) => {
    setToastMsg(msg); setToastError(isError); setShowToast(true);
    setTimeout(() => setShowToast(false), 2800);
  };

  // ── API: order status update (apiPost from api.ts) ──
  const updateOrderInDB = async (newStatus: 'picked_up' | 'on_the_way') => {
    setApiLoading(true);
    try {
      const statusMap: Record<string, string> = {
        picked_up: 'picked',     // backend expects "picked"
        on_the_way: 'on_the_way', // same
      };
      const body = { status: statusMap[newStatus] };

      // your BASE: POST https://shriecom.in/.../api/orders/{id}/update-status
      await apiPost(`delivery/orders/${orderId}/status`, body);

      setDeliveryStatus(newStatus);
      onStatusChange?.(newStatus);

      if (newStatus === 'picked_up') toast('📦 Order picked up! DB updated ✓');
      else toast('🚚 On the Way! Customer notified ✓');

    } catch (err) {
      console.error('Order status update failed:', err);
      toast('❌ Update failed, please try again', true);
    } finally {
      setApiLoading(false);
    }
  };

  const pillClass = deliveryStatus === 'picked_up' ? 'pickup' : 'otw';

  return (
    <>
      <style>{css}</style>
      <div className="rm-root">

        {/* Topbar */}
        <div className="rm-topbar">
          <button className="rm-back-btn" onClick={onBack} aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="rm-topbar-info">
            <div className="rm-topbar-title">{warehouseName || 'Warehouse Location'}</div>
            <div className="rm-topbar-sub">{warehouseLat.toFixed(4)}° N, {warehouseLng.toFixed(4)}° E</div>
          </div>
          {deliveryStatus !== 'pending' && (
            <span className={`rm-status-pill ${pillClass}`}>
              {deliveryStatus === 'picked_up' ? 'Picked Up' : 'On the Way'}
            </span>
          )}
        </div>

        {/* GPS Error */}
        {locErr && (
          <div style={{ margin:'8px 14px 0', background:'#fef2f2', border:'1px solid #fecaca',
            borderRadius:10, padding:'8px 12px', fontSize:11, color:'#ef4444', fontWeight:600, textAlign:'center' }}>
            {permissionDenied ? '📍 Location permission denied' : '📍 GPS signal not found'}
          </div>
        )}

        {/* Status Banner */}
        {deliveryStatus === 'picked_up' && (
          <div className="rm-banner pickup">
            <span className="rm-banner-icon">📦</span>
            <div className="rm-banner-text">
              <div className="rm-banner-title pickup">Order Picked Up!</div>
              <div className="rm-banner-sub">Now press "On the Way" to notify the customer</div>
            </div>
            <span className="rm-banner-badge pickup">PICKED</span>
          </div>
        )}
        {deliveryStatus === 'on_the_way' && (
          <div className="rm-banner otw">
            <span className="rm-banner-icon">🚚</span>
            <div className="rm-banner-text">
              <div className="rm-banner-title otw">On the Way!</div>
              <div className="rm-banner-sub">The customer has been notified</div>
            </div>
            <span className="rm-banner-badge otw">LIVE</span>
          </div>
        )}

        {/* Map */}
        <div className="rm-map-wrap">
          <iframe title="Warehouse Route Map" src={embedUrl} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>
          {locating && (
            <div className="rm-locating"><div className="rm-spin"/>Finding your location…</div>
          )}
          {!locating && !locErr && (
            <div className="rm-loc-badge"><div className="rm-live-dot"/>Current Location</div>
          )}
          {distKm !== null && (
            <div className="rm-eta-card">
              <div className="rm-eta-item">
                <span className="rm-eta-val">{formatETA(distKm)}</span>
                <span className="rm-eta-lbl">ETA</span>
              </div>
              <div className="rm-eta-divider"/>
              <div className="rm-eta-item">
                <span className="rm-eta-val">{formatDist(distKm)}</span>
                <span className="rm-eta-lbl">Distance</span>
              </div>
            </div>
          )}
        </div>

        {/* Info Strip */}
        <div className="rm-strip">
          <div className="rm-strip-icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="rm-strip-text">
            <div className="rm-strip-title">{warehouseName || 'Warehouse'}</div>
            <div className="rm-strip-sub">{warehouseLat.toFixed(5)}, {warehouseLng.toFixed(5)}</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="rm-btns">

          {/* STEP 1: Pick Up button */}
          {deliveryStatus === 'pending' && (
            <button
              className={`rm-btn-pickup${apiLoading ? ' rm-btn-loading' : ''}`}
              onClick={() => updateOrderInDB('picked_up')}
              disabled={apiLoading}
            >
              {apiLoading
                ? <><div className="rm-btn-spinner"/>Updating…</>
                : <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10"/>
                      <path d="M23 3H1l2 7h18l2-7z"/>
                      <line x1="12" y1="12" x2="12" y2="21"/>
                    </svg>
                    Picked Up Order
                  </>
              }
            </button>
          )}

          {/* STEP 2: On the Way button */}
          {deliveryStatus === 'picked_up' && (
            <button
              className={`rm-btn-otw${apiLoading ? ' rm-btn-loading' : ''}`}
              onClick={() => updateOrderInDB('on_the_way')}
              disabled={apiLoading}
            >
              {apiLoading
                ? <><div className="rm-btn-spinner"/>Updating…</>
                : <>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" rx="1"/>
                      <path d="M16 8h4l3 5v4h-7V8z"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                    On the Way
                  </>
              }
            </button>
          )}

          {/* STEP 3: Confirmed (disabled) */}
          {deliveryStatus === 'on_the_way' && (
            <button className="rm-btn-otw" disabled>✓ On the Way Marked</button>
          )}

          {/* Navigate — always visible */}
          <a
            className="rm-btn-navigate"
            href={navUrl} target="_blank" rel="noopener noreferrer"
            style={deliveryStatus !== 'pending' ? { flex:'0 0 46px', padding:'13px 0' } : {}}
            title="Navigate"
          >
            {deliveryStatus !== 'pending' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
                Navigate to Warehouse
              </>
            )}
          </a>

          <button className="rm-btn-copy"
            onClick={() => {
              navigator.clipboard?.writeText(`${warehouseLat}, ${warehouseLng}`).catch(()=>{});
              toast('✓ Coordinates copied!');
            }}
            aria-label="Copy coordinates">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
        </div>

      </div>

      <div className={`rm-toast${showToast ? ' show' : ''}${toastError ? ' error' : ''}`}>{toastMsg}</div>
    </>
  );
};

export default WarehouseMap;