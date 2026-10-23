import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  IonPage, IonContent, IonHeader, IonToolbar,
  IonButtons, IonBackButton, IonTitle, IonIcon,
  IonButton,
} from "@ionic/react";
import {
  callOutline, checkmarkCircleOutline, navigateOutline,
  timeOutline, locationOutline, cashOutline, arrowBackOutline
} from "ionicons/icons";
import { apiGet, apiPost } from "../api";

// ── Types ────────────────────────────────────────────────
interface OrderDetail {
  id: number | string;
  billing_name: string;
  billing_phone: string;
  billing_address: string;
  billing_city: string;
  amount: number;
  cod: number;
  dstatus: string;
  items: { name: string; qty: number; price: number }[];
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  restaurant_lat?: number | null;
  restaurant_lng?: number | null;
  restaurant_name?: string;
  eta_minutes?: number | null;
  distance_km?: number | null;
  picked_at?: string | null;
}

interface Props {
  orderId: number | string;
  initialStatus?: string;
  onBack: () => void;
  onDelivered?: () => void;
}

// ── Leaflet loader ───────────────────────────────────────
const loadLeaflet = (): Promise<any> =>
  new Promise((resolve, reject) => {
    if ((window as any).L) { resolve((window as any).L); return; }
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = () => reject(new Error("Leaflet load failed"));
    document.head.appendChild(script);
  });

const makeIcon = (L: any, emoji: string, size = 40) =>
  L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:#fff;display:flex;align-items:center;justify-content:center;
      font-size:${size * 0.5}px;box-shadow:0 3px 12px rgba(0,0,0,0.28);
      border:2.5px solid #fff;">
      ${emoji}
    </div>`,
    className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });

// ── Defaults ─────────────────────────────────────────────
const DEFAULT_REST = { lat: 26.8553, lng: 80.9452 };

const DSTATUS_STEPS = [
  { key: "accepted",   label: "Accepted",   icon: "✅", desc: "You accepted this order" },
  { key: "picked",     label: "Picked Up",  icon: "📦", desc: "Picked from restaurant" },
  { key: "on_the_way", label: "On the Way", icon: "🛵", desc: "Heading to customer" },
  { key: "delivered",  label: "Delivered",  icon: "🏠", desc: "Order delivered!" },
];
const STATUS_ORDER = ["accepted", "picked", "on_the_way", "delivered"];
const getStepIndex = (status: string) =>
  STATUS_ORDER.indexOf(String(status).toLowerCase().trim());

// ── Styles ───────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
  :root {
    --orange: #f97316;
    --green:  #22c55e;
    --red:    #ef4444;
    --blue:   #3b82f6;
    --amber:  #f59e0b;
    --dark:   #0f172a;
    --mid:    #64748b;
    --light:  #f1f5f9;
    --border: #e2e8f0;
    --font:   'Sora', sans-serif;
    --mono:   'JetBrains Mono', monospace;
    --r:      16px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .dm-map-wrapper { position: relative; height: 48vh; min-height: 240px; background: #e8f0fe; }
  .dm-map         { width: 100%; height: 100%; }
  .dm-map-error   { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 8px; color: var(--mid); font-size: 13px; font-family: var(--font); }

  .dm-eta-badge {
    position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
    background: var(--dark); color: #fff;
    padding: 8px 20px; border-radius: 24px;
    display: flex; align-items: center; gap: 8px;
    font-family: var(--font); font-size: 13px; font-weight: 600;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25); z-index: 400; white-space: nowrap;
  }
  .dm-eta-time { font-family: var(--mono); font-size: 18px; font-weight: 700; color: var(--orange); }
  .dm-eta-sep  { width: 1px; height: 18px; background: rgba(255,255,255,0.2); }

  .dm-map-btns { position: absolute; top: 12px; right: 12px; z-index: 400; display: flex; flex-direction: column; gap: 8px; }
  .dm-nav-btn {
    background: var(--orange); border: none; border-radius: 12px;
    padding: 10px 14px; cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font); font-size: 12px; font-weight: 700; color: #fff;
    box-shadow: 0 3px 10px rgba(249,115,22,0.4);
  }
  .dm-recenter-btn {
    background: var(--dark); border: none; border-radius: 12px;
    padding: 10px 14px; cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font); font-size: 12px; font-weight: 700; color: #fff;
    box-shadow: 0 3px 10px rgba(0,0,0,0.25);
  }

  .dm-sheet {
    background: #fff; border-radius: 24px 24px 0 0;
    margin-top: -20px; position: relative; z-index: 5;
    padding: 0 0 120px; overflow-y: auto;
    box-shadow: 0 -4px 24px rgba(0,0,0,0.08);
  }
  .dm-handle { width: 40px; height: 4px; background: var(--border); border-radius: 2px; margin: 14px auto 0; }

  .dm-cust-card {
    margin: 16px 16px 0;
    background: #fff7ed; border: 1.5px solid #fed7aa;
    border-radius: var(--r); padding: 14px 16px;
    display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
  }
  .dm-cust-name  { font-family: var(--font); font-size: 16px; font-weight: 800; color: var(--dark); margin-bottom: 3px; }
  .dm-cust-addr  { font-size: 12px; color: var(--mid); line-height: 1.5; }
  .dm-cust-phone { font-family: var(--mono); font-size: 12px; font-weight: 700; color: var(--orange); margin-top: 6px; }
  .dm-call-btn {
    flex-shrink: 0; width: 44px; height: 44px; border-radius: 50%;
    background: #22c55e; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 10px rgba(34,197,94,0.35);
  }

  .dm-cod-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: #fff7ed; border: 1.5px solid #fed7aa;
    border-radius: 8px; padding: 4px 10px;
    font-size: 11px; font-weight: 700; color: var(--orange);
    font-family: var(--font); margin-top: 6px;
  }

  .dm-cod-card {
    margin: 12px 16px 0;
    background: linear-gradient(135deg,#fff7ed,#fef3c7);
    border: 1.5px solid #fde68a; border-radius: var(--r); padding: 14px 16px;
    display: flex; align-items: center; gap: 12px;
  }
  .dm-cod-icon  { font-size: 28px; flex-shrink: 0; }
  .dm-cod-title { font-size: 14px; font-weight: 800; color: #92400e; margin-bottom: 2px; font-family: var(--font); }
  .dm-cod-sub   { font-size: 12px; color: #b45309; font-family: var(--font); }
  .dm-cod-amt   { font-size: 22px; font-weight: 800; font-family: var(--mono); color: #b45309; margin-left: auto; }

  .dm-progress       { margin: 18px 16px 0; }
  .dm-progress-title { font-family: var(--font); font-size: 11px; font-weight: 700; color: var(--mid); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 14px; }
  .dm-steps  { display: flex; align-items: flex-start; }
  .dm-step   { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; }
  .dm-step-connector { position: absolute; top: 18px; left: 50%; right: -50%; height: 2px; z-index: 0; }
  .dm-step-connector-done    { background: var(--orange); }
  .dm-step-connector-pending { background: var(--border); }
  .dm-dot {
    width: 36px; height: 36px; border-radius: 50%; z-index: 1;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 800; position: relative;
    border: 2px solid transparent; flex-shrink: 0;
  }
  .dm-dot-done    { background: var(--orange); color: #fff; border-color: var(--orange); }
  .dm-dot-active  { background: #fff; color: var(--orange); border-color: var(--orange); box-shadow: 0 0 0 5px rgba(249,115,22,0.15); }
  .dm-dot-pending { background: var(--light); color: var(--mid); border-color: var(--border); }
  .dm-step-label        { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--mid); margin-top: 7px; text-align: center; line-height: 1.3; }
  .dm-step-label-active { color: var(--orange); }
  .dm-step-label-done   { color: var(--dark); }

  .dm-items       { margin: 18px 16px 0; }
  .dm-items-title { font-family: var(--font); font-size: 11px; font-weight: 700; color: var(--mid); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 10px; }
  .dm-item-row    { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--light); font-family: var(--font); }
  .dm-item-row:last-child { border-bottom: none; }
  .dm-item-name  { font-size: 13px; font-weight: 600; color: var(--dark); }
  .dm-item-qty   { font-size: 11px; color: var(--mid); margin-top: 2px; }
  .dm-item-price { font-family: var(--mono); font-size: 13px; font-weight: 700; color: var(--dark); }
  .dm-total-row  { display: flex; justify-content: space-between; padding: 12px 0 0; margin-top: 4px; border-top: 2px solid var(--dark); }
  .dm-total-label { font-family: var(--font); font-size: 13px; font-weight: 700; color: var(--dark); }
  .dm-total-val   { font-family: var(--mono); font-size: 16px; font-weight: 700; color: var(--dark); }

  .dm-action-bar {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    padding: 14px 16px 28px; background: #fff;
    border-top: 1px solid var(--border);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
  }
  .dm-action-btn {
    width: 100%; padding: 16px; border: none; border-radius: 14px;
    font-family: var(--font); font-size: 15px; font-weight: 800;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .15s, transform .1s;
  }
  .dm-action-btn:active  { opacity: 0.85; transform: scale(0.98); }
  .dm-action-btn-pickup  { background: var(--orange); color: #fff; box-shadow: 0 4px 14px rgba(249,115,22,0.38); }
  .dm-action-btn-onway   { background: var(--blue);   color: #fff; box-shadow: 0 4px 14px rgba(59,130,246,0.35); }
  .dm-action-btn-deliver { background: var(--green);  color: #fff; box-shadow: 0 4px 14px rgba(34,197,94,0.38); }
  .dm-action-btn-done    { background: var(--light);  color: var(--mid); cursor: not-allowed; }
  .dm-action-btn:disabled { opacity: .6; cursor: not-allowed; }

  .dm-loading  { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 14px; }
  .dm-spinner  { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--orange); border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .dm-err-box  { margin: 20px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 18px; text-align: center; color: var(--red); font-size: 13px; font-family: var(--font); }

  .dm-delivered-banner {
    margin: 16px; padding: 18px; border-radius: var(--r);
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 1.5px solid #86efac;
    display: flex; align-items: center; gap: 12px; font-family: var(--font);
  }
  .dm-delivered-icon  { font-size: 32px; flex-shrink: 0; }
  .dm-delivered-title { font-size: 15px; font-weight: 800; color: #166534; margin-bottom: 2px; }
  .dm-delivered-sub   { font-size: 12px; color: #15803d; }

  .dm-live-pill {
    position: absolute; top: 12px; left: 12px; z-index: 400;
    background: #ef4444; border-radius: 20px; padding: 6px 12px;
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font); font-size: 11px; font-weight: 700; color: #fff;
    box-shadow: 0 2px 8px rgba(239,68,68,0.4);
  }
  .dm-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #fff; animation: livePulse 1.5s ease-in-out infinite; }
  @keyframes livePulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

  .dm-gps-pill {
    position: absolute; top: 12px; left: 12px; z-index: 400;
    background: #f59e0b; border-radius: 20px; padding: 6px 12px;
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font); font-size: 11px; font-weight: 700; color: #fff;
    box-shadow: 0 2px 8px rgba(245,158,11,0.4);
  }

  /* ── OTP Modal ── */
  .dm-otp-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    z-index: 500; display: flex; align-items: flex-end;
    backdrop-filter: blur(4px);
  }
  .dm-otp-sheet {
    background: #fff; width: 100%; border-radius: 28px 28px 0 0;
    padding: 0 0 40px; font-family: var(--font);
    animation: slideUp .3s cubic-bezier(0.34, 1.56, 0.64, 1);
    max-height: 92vh; overflow-y: auto;
  }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

  /* OTP Sheet Header */
  .dm-otp-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border-radius: 28px 28px 0 0;
    padding: 28px 24px 24px;
    text-align: center;
  }
  .dm-otp-header-icon { font-size: 48px; margin-bottom: 12px; display: block; }
  .dm-otp-header-title {
    font-size: 20px; font-weight: 800; color: #fff;
    margin-bottom: 6px; letter-spacing: -0.3px;
  }
  .dm-otp-header-sub { font-size: 13px; color: #94a3b8; line-height: 1.5; }

  /* Amount badge inside header */
  .dm-otp-amount-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(249,115,22,0.15); border: 1.5px solid rgba(249,115,22,0.4);
    border-radius: 12px; padding: 8px 18px; margin-top: 14px;
  }
  .dm-otp-amount-label { font-size: 11px; font-weight: 700; color: #f97316; text-transform: uppercase; letter-spacing: .06em; }
  .dm-otp-amount-val   { font-family: var(--mono); font-size: 22px; font-weight: 700; color: #f97316; }

  .dm-otp-body { padding: 20px 20px 0; }

  /* Status Box */
  .dm-otp-status-box {
    border-radius: 14px; padding: 14px 16px;
    margin-bottom: 20px;
    display: flex; align-items: center; gap: 12px;
  }
  .dm-otp-status-sending  { background: #f8fafc; border: 1.5px solid #e2e8f0; }
  .dm-otp-status-sent     { background: #f0fdf4; border: 1.5px solid #86efac; }
  .dm-otp-status-failed   { background: #fef2f2; border: 1.5px solid #fecaca; }
  .dm-otp-status-icon     { font-size: 28px; flex-shrink: 0; }
  .dm-otp-status-text     { flex: 1; }
  .dm-otp-status-label    { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
  .dm-otp-status-sublabel { font-size: 11px; line-height: 1.4; }
  .dm-otp-status-sending  .dm-otp-status-label    { color: #475569; }
  .dm-otp-status-sending  .dm-otp-status-sublabel { color: #94a3b8; }
  .dm-otp-status-sent     .dm-otp-status-label    { color: #166534; }
  .dm-otp-status-sent     .dm-otp-status-sublabel { color: #15803d; }
  .dm-otp-status-failed   .dm-otp-status-label    { color: #dc2626; }
  .dm-otp-status-failed   .dm-otp-status-sublabel { color: #ef4444; }

  /* SMS Sending Spinner */
  .dm-sms-spinner {
    width: 28px; height: 28px; border: 3px solid #e2e8f0;
    border-top-color: var(--orange); border-radius: 50%;
    animation: spin .7s linear infinite; flex-shrink: 0;
  }

  /* OTP Boxes — 4 individual digit boxes */
  .dm-otp-boxes-label {
    font-size: 11px; font-weight: 700; color: var(--mid);
    text-transform: uppercase; letter-spacing: .08em; margin-bottom: 10px;
  }
  .dm-otp-boxes {
    display: flex; gap: 10px; justify-content: center; margin-bottom: 6px;
  }
  .dm-otp-box {
    width: 64px; height: 72px; border: 2px solid var(--border);
    border-radius: 14px; background: #f8fafc;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--mono); font-size: 28px; font-weight: 700; color: var(--dark);
    transition: border-color .2s, background .2s, transform .15s;
    position: relative; overflow: hidden;
  }
  .dm-otp-box.filled  { border-color: var(--orange); background: #fff7ed; transform: scale(1.04); }
  .dm-otp-box.focused { border-color: var(--orange); background: #fff; box-shadow: 0 0 0 4px rgba(249,115,22,0.15); }
  .dm-otp-box.error   { border-color: var(--red); background: #fef2f2; animation: shake .4s ease; }
  .dm-otp-box.success { border-color: var(--green); background: #f0fdf4; }
  @keyframes shake {
    0%,100%{transform:translateX(0);}
    20%{transform:translateX(-4px);}
    40%{transform:translateX(4px);}
    60%{transform:translateX(-4px);}
    80%{transform:translateX(4px);}
  }

  /* Hidden real input behind boxes */
  .dm-otp-hidden-input {
    position: absolute; opacity: 0; width: 1px; height: 1px;
    pointer-events: none;
  }

  .dm-otp-error-msg { font-size: 12px; color: var(--red); text-align: center; margin: 8px 0 0; font-weight: 600; min-height: 18px; }
  .dm-otp-note      { font-size: 11px; color: var(--mid); text-align: center; margin-top: 8px; line-height: 1.5; }

  .dm-otp-resend-row { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 14px; }
  .dm-otp-resend-timer { font-size: 12px; color: var(--mid); font-weight: 600; font-family: var(--mono); }
  .dm-otp-resend-btn {
    background: none; border: none; color: var(--orange);
    font-family: var(--font); font-size: 13px; font-weight: 700;
    cursor: pointer; padding: 6px 10px; border-radius: 8px;
    transition: background .15s;
  }
  .dm-otp-resend-btn:hover   { background: #fff7ed; }
  .dm-otp-resend-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Action buttons */
  .dm-otp-verify-btn {
    width: 100%; padding: 16px; border: none; border-radius: 14px;
    background: linear-gradient(135deg, #16a34a, #22c55e); color: #fff;
    font-family: var(--font); font-size: 15px; font-weight: 800;
    cursor: pointer; margin-top: 20px;
    box-shadow: 0 4px 16px rgba(34,197,94,0.4);
    transition: opacity .15s, transform .1s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .dm-otp-verify-btn:active   { transform: scale(0.98); }
  .dm-otp-verify-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .dm-otp-cancel-btn {
    width: 100%; padding: 13px; border: 1.5px solid var(--border); border-radius: 14px;
    background: transparent; color: var(--mid);
    font-family: var(--font); font-size: 14px; font-weight: 600;
    cursor: pointer; margin-top: 10px;
    transition: background .15s;
  }
  .dm-otp-cancel-btn:hover { background: #f8fafc; }

  /* Verify success animation */
  .dm-otp-success-overlay {
    position: absolute; inset: 0; background: rgba(255,255,255,0.95);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; z-index: 10; border-radius: 28px 28px 0 0;
    animation: fadeIn .3s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .dm-otp-success-icon   { font-size: 64px; animation: bounceIn .5s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .dm-otp-success-title  { font-size: 20px; font-weight: 800; color: #166534; }
  .dm-otp-success-sub    { font-size: 13px; color: #15803d; text-align: center; }
  @keyframes bounceIn { 0%{transform:scale(0);} 100%{transform:scale(1);} }

  /* Steps for OTP instructions */
  .dm-otp-steps {
    background: #f8fafc; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;
  }
  .dm-otp-step-item {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 12px; color: #475569; line-height: 1.5;
    padding: 4px 0;
  }
  .dm-otp-step-num {
    width: 20px; height: 20px; border-radius: 50%;
    background: var(--orange); color: #fff;
    font-size: 10px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px;
  }
`;

// ── Main Component ────────────────────────────────────────
const DeliveryMap: React.FC<Props> = ({ orderId, initialStatus, onBack, onDelivered }) => {
  const [order, setOrder] = useState<OrderDetail | null>(
    initialStatus
      ? ({ dstatus: initialStatus, cod: 0, amount: 0, items: [] } as any)
      : null
  );
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // GPS
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  const [gpsReady, setGpsReady] = useState(false);

  // OTP state
  const [showOtpModal, setShowOtpModal]   = useState(false);
  const [otpInput, setOtpInput]           = useState('');
  const [otpError, setOtpError]           = useState('');
  const [otpSending, setOtpSending]       = useState(false);
  const [otpSent, setOtpSent]             = useState(false);
  const [otpSendFailed, setOtpSendFailed] = useState(false);
  const [otpSuccess, setOtpSuccess]       = useState(false);
  const [resendTimer, setResendTimer]     = useState(0);
  const [focusedBox, setFocusedBox]       = useState<number>(-1);

  const mapRef       = useRef<HTMLDivElement>(null);
  const mapObj       = useRef<any>(null);
  const myMarker     = useRef<any>(null);
  const watchRef     = useRef<number | null>(null);
  const leafletRef   = useRef<any>(null);
  const latestGpsRef = useRef<{ lat: number; lng: number } | null>(null);
  const otpInputRef  = useRef<HTMLInputElement>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch order ───────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    try {
      const res  = await apiGet(`delivery/orders/${orderId}`);
      const data: OrderDetail = res?.data ?? res;
      if (data && data.id) {
        setOrder(() => ({
          ...data,
          amount: Number(data.amount),
          dstatus: (
            initialStatus &&
            getStepIndex(initialStatus) > getStepIndex(data.dstatus)
          ) ? initialStatus : data.dstatus,
        }));
      } else {
        setError("Order details not found.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [orderId, initialStatus]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // ── Resend countdown timer ────────────────────────────
  const startResendTimer = () => {
    setResendTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── GPS watch ─────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMyLat(lat); setMyLng(lng);
        latestGpsRef.current = { lat, lng };
      apiPost("/delivery/update-location", { latitude: lat, longitude: lng }).catch(() => {});
        if (myMarker.current) {
          myMarker.current.setLatLng([lat, lng]);
        } else if (mapObj.current && leafletRef.current) {
          const L = leafletRef.current;
          myMarker.current = L.marker([lat, lng], { icon: makeIcon(L, "🛵", 48) })
            .addTo(mapObj.current).bindPopup("<b>You (Delivery rider)</b>");
        }
        if (!gpsReady) setGpsReady(true);
      },
      () => { setGpsReady(false); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
    );
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // ── Init map ──────────────────────────────────────────
  useEffect(() => {
    if (!order || !order.billing_name || mapObj.current) return;
    const restLat = order.restaurant_lat ?? DEFAULT_REST.lat;
    const restLng = order.restaurant_lng ?? DEFAULT_REST.lng;
    const custLat = order.delivery_lat   ?? (restLat + 0.012);
    const custLng = order.delivery_lng   ?? (restLng + 0.018);

    loadLeaflet().then((L: any) => {
      if (!mapRef.current || mapObj.current) return;
      leafletRef.current = L;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      const map = L.map(mapRef.current, {
        center: [(restLat + custLat) / 2, (restLng + custLng) / 2],
        zoom: 14, zoomControl: false, attributionControl: false,
      });
      mapObj.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      L.marker([restLat, restLng], { icon: makeIcon(L, "🍽️", 42) })
        .addTo(map).bindPopup(`<b>${order.restaurant_name ?? "Restaurant"}</b><br>Pickup point`);
      L.marker([custLat, custLng], { icon: makeIcon(L, "🏠", 42) })
        .addTo(map).bindPopup(`<b>${order.billing_name}</b><br>${order.billing_address}, ${order.billing_city}`);
      L.polyline([[restLat, restLng], [custLat, custLng]],
        { color: "#f97316", weight: 4, opacity: 0.9, dashArray: "10, 8" }).addTo(map);
      if (latestGpsRef.current) {
        const { lat, lng } = latestGpsRef.current;
        myMarker.current = L.marker([lat, lng], { icon: makeIcon(L, "🛵", 48) })
          .addTo(map).bindPopup("<b>You (Delivery rider)</b>");
      }
      map.fitBounds([[restLat, restLng], [custLat, custLng]], { padding: [48, 48] });
    }).catch(() => setMapError("Map could not be loaded."));

    return () => {
      if (mapObj.current) { mapObj.current.remove(); mapObj.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.billing_name]);

  // ── Recenter ──────────────────────────────────────────
  const handleRecenter = () => {
    if (!mapObj.current) return;
    if (myLat && myLng) {
      mapObj.current.setView([myLat, myLng], 15);
    } else if (order) {
      const restLat = order.restaurant_lat ?? DEFAULT_REST.lat;
      const restLng = order.restaurant_lng ?? DEFAULT_REST.lng;
      const custLat = order.delivery_lat   ?? (restLat + 0.012);
      const custLng = order.delivery_lng   ?? (restLng + 0.018);
      mapObj.current.fitBounds([[restLat, restLng], [custLat, custLng]], { padding: [48, 48] });
    }
  };

  // ── Navigation ────────────────────────────────────────
  const openNavigation = () => {
    if (!order) return;
    const lat = order.delivery_lat;
    const lng = order.delivery_lng;
    if (lat && lng) {
      window.open(`https://maps.google.com/?q=${lat},${lng}`, "_blank");
    } else {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(`${order.billing_address}, ${order.billing_city}`)}`, "_blank");
    }
  };

  // ── Core status update ────────────────────────────────
  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      await apiPost(`delivery/orders/${orderId}/status`, { status: newStatus });
      setOrder(prev => prev ? { ...prev, dstatus: newStatus } : prev);
      if (newStatus === "delivered") {
        if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
        onDelivered?.();
      }
    } catch {
      alert("Status update failed. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // ── OTP: Send via backend ─────────────────────────────
  const requestOtp = async () => {
    setOtpSending(true);
    setOtpSendFailed(false);
    setOtpError('');
    try {
      await apiPost(`delivery/orders/${orderId}/send-otp`, {});
      setOtpSent(true);
      startResendTimer();
    } catch {
      setOtpSendFailed(true);
      setOtpError('Failed to send SMS. Please retry.');
    } finally {
      setOtpSending(false);
    }
  };

  // ── OTP: Open modal ───────────────────────────────────
  const openOtpModal = () => {
    setOtpInput('');
    setOtpError('');
    setOtpSent(false);
    setOtpSendFailed(false);
    setOtpSuccess(false);
    setFocusedBox(-1);
    setShowOtpModal(true);
    requestOtp();
  };

  // ── OTP: Focus hidden input when user taps boxes ──────
  const handleBoxTap = () => {
    if (otpInputRef.current && otpSent) {
      otpInputRef.current.focus();
      setFocusedBox(Math.min(otpInput.length, 3));
    }
  };

  // ── OTP: Handle input change ──────────────────────────
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setOtpInput(val);
    setOtpError('');
    setFocusedBox(Math.min(val.length, 3));
    if (val.length === 4 && otpSent) {
      setTimeout(() => verifyAndDeliver(val), 300);
    }
  };

  // ── OTP: Verify and deliver ───────────────────────────
  const verifyAndDeliver = async (otp?: string) => {
    const code = otp ?? otpInput;
    if (code.length !== 4) return;
    setUpdating(true);
    setOtpError('');
    try {
      await apiPost(`delivery/orders/${orderId}/verify-otp-deliver`, { otp: code });
      setOtpSuccess(true);
      setTimeout(() => {
        setShowOtpModal(false);
        setOrder(prev => prev ? { ...prev, dstatus: 'delivered' } : prev);
        if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
        onDelivered?.();
      }, 1800);
    } catch (err: any) {
      setOtpError('Incorrect OTP! Please ask the customer again.');
      setOtpInput('');
      setFocusedBox(0);
      if (otpInputRef.current) otpInputRef.current.focus();
    } finally {
      setUpdating(false);
    }
  };

  // ── Deliver button handler ────────────────────────────
  const handleDeliverClick = () => {
    if (order?.cod === 1) {
      openOtpModal();
    } else {
      updateStatus('delivered');
    }
  };

  // ── Action button config ──────────────────────────────
  const getActionBtn = () => {
    const s = String(order?.dstatus ?? "").toLowerCase().trim();
    if (s === "assigned" || s === "accepted")
      return { label: "📦 Mark as Picked Up", cls: "dm-action-btn-pickup", next: "picked" };
    if (s === "picked")
      return { label: "🛵 Start Delivery — On the Way", cls: "dm-action-btn-onway", next: "on_the_way" };
    if (s === "on_the_way")
      return {
        label: order?.cod === 1 ? "🔐 Verify OTP & Collect Cash" : "✅ Mark as Delivered",
        cls: "dm-action-btn-deliver",
        next: "delivered",
      };
    return null;
  };

  const actionBtn   = order ? getActionBtn() : null;
  const stepIndex   = order ? getStepIndex(order.dstatus) : -1;
  const isDelivered = order?.dstatus === "delivered";

  // ── OTP digit boxes renderer ──────────────────────────
  const renderOtpBoxes = () => {
    const digits = otpInput.split('');
    return (
      <div
        className="dm-otp-boxes"
        onClick={handleBoxTap}
        style={{ cursor: otpSent ? 'text' : 'not-allowed' }}
      >
        {[0, 1, 2, 3].map(i => {
          const filled  = digits[i] !== undefined;
          const focused = focusedBox === i && otpSent && !otpError;
          const hasErr  = otpError && otpInput.length === 0;
          const isSucc  = otpSuccess;
          let cls = 'dm-otp-box';
          if (isSucc)        cls += ' success';
          else if (hasErr)   cls += ' error';
          else if (filled)   cls += ' filled';
          else if (focused)  cls += ' focused';
          return (
            <div key={i} className={cls}>
              {filled ? digits[i] : (focused ? <span style={{ color: '#f97316', animation: 'blink 1s step-end infinite' }}>|</span> : '')}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────
  return (
    <IonPage>
      <style>{CSS}</style>

      <IonHeader translucent>
        <IonToolbar style={{ "--background": "#f97316", "--color": "#fff" } as any}>
          <IonButton fill="clear" onClick={onBack} style={{ color: "#fff" }}>
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle style={{ color: "#fff", fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16 }}>
            Deliver #{orderId}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen scrollY={false}>

        {loading && !order?.billing_name && (
          <div className="dm-loading">
            <div className="dm-spinner" />
            <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, color: "#64748b" }}>
              Loading delivery details…
            </p>
          </div>
        )}

        {!loading && error && !order?.billing_name && (
          <div className="dm-err-box">
            ⚠️ {error}
            <br />
            <button
              onClick={fetchOrder}
              style={{
                marginTop: 10, background: "#f97316", color: "#fff", border: "none",
                borderRadius: 8, padding: "7px 18px", fontWeight: 700,
                fontFamily: "'Sora',sans-serif", cursor: "pointer", fontSize: 13,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {order && (
          <div style={{ height: "100%", overflowY: "auto" }}>
            {/* Map */}
            <div className="dm-map-wrapper">
              {mapError ? (
                <div className="dm-map-error">
                  <span style={{ fontSize: 36 }}>🗺️</span>
                  <p>{mapError}</p>
                </div>
              ) : (
                <div ref={mapRef} className="dm-map" />
              )}

              {!isDelivered && gpsReady && (
                <div className="dm-live-pill">
                  <div className="dm-live-dot" />LIVE
                </div>
              )}
              {!isDelivered && !gpsReady && (
                <div className="dm-gps-pill">⏳ Getting GPS…</div>
              )}

              <div className="dm-map-btns">
                <button className="dm-nav-btn" onClick={openNavigation}>
                  <IonIcon icon={navigateOutline} style={{ fontSize: 15 }} />Navigate
                </button>
                <button className="dm-recenter-btn" onClick={handleRecenter}>
                  <IonIcon icon={locationOutline} style={{ fontSize: 15 }} />Recenter
                </button>
              </div>

              <div className="dm-eta-badge">
                <IonIcon icon={timeOutline} style={{ fontSize: 16, color: "#9ca3af" }} />
                <span className="dm-eta-time">
                  {isDelivered ? "Done!" : order.eta_minutes != null ? `${order.eta_minutes} min` : "—"}
                </span>
                <div className="dm-eta-sep" />
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  {order.distance_km != null ? `${order.distance_km} km` : "ETA"}
                </span>
              </div>
            </div>

            {/* Bottom Sheet */}
            <div className="dm-sheet">
              <div className="dm-handle" />

              {isDelivered && (
                <div className="dm-delivered-banner">
                  <div className="dm-delivered-icon">🎉</div>
                  <div>
                    <div className="dm-delivered-title">Order Delivered!</div>
                    <div className="dm-delivered-sub">Successfully delivered to {order.billing_name}</div>
                  </div>
                </div>
              )}

              {order.billing_name && (
                <div className="dm-cust-card">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="dm-cust-name">{order.billing_name}</div>
                    <div className="dm-cust-addr">
                      <IonIcon icon={locationOutline} style={{ fontSize: 12, verticalAlign: "middle", marginRight: 4, color: "#f97316" }} />
                      {order.billing_address}, {order.billing_city}
                    </div>
                    <div className="dm-cust-phone">📞 {order.billing_phone}</div>
                    {order.cod === 1 && (
                      <div className="dm-cod-badge">
                        💵 COD — Collect ₹{Number(order.amount).toFixed(0)} from customer
                      </div>
                    )}
                  </div>
                  <button
                    className="dm-call-btn"
                    onClick={() => window.open(`tel:${order.billing_phone}`)}
                    aria-label="Call customer"
                  >
                    <IonIcon icon={callOutline} style={{ fontSize: 20, color: "#fff" }} />
                  </button>
                </div>
              )}

              {order.cod === 1 && !isDelivered && order.dstatus === 'on_the_way' && (
                <div className="dm-cod-card">
                  <div className="dm-cod-icon">💵</div>
                  <div>
                    <div className="dm-cod-title">COD Collection Required</div>
                    <div className="dm-cod-sub">An OTP will be sent to the customer's phone — verify it and collect the cash</div>
                  </div>
                  <div className="dm-cod-amt">₹{Number(order.amount).toFixed(0)}</div>
                </div>
              )}

              <div className="dm-progress">
                <div className="dm-progress-title">Delivery Progress</div>
                <div className="dm-steps">
                  {DSTATUS_STEPS.map((step, i) => {
                    const done   = i < stepIndex;
                    const active = i === stepIndex;
                    return (
                      <div key={step.key} className="dm-step">
                        {i < DSTATUS_STEPS.length - 1 && (
                          <div className={`dm-step-connector ${done ? "dm-step-connector-done" : "dm-step-connector-pending"}`} />
                        )}
                        <div className={`dm-dot ${done ? "dm-dot-done" : active ? "dm-dot-active" : "dm-dot-pending"}`}>
                          {done ? "✓" : step.icon}
                        </div>
                        <div className={`dm-step-label ${done ? "dm-step-label-done" : active ? "dm-step-label-active" : ""}`}>
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {order.items && (
                <div className="dm-items">
                  <div className="dm-items-title">Order Items</div>
                  {order.items.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "10px 0" }}>
                      No items found
                    </p>
                  ) : (
                    order.items.map((item, i) => (
                      <div key={i} className="dm-item-row">
                        <div>
                          <div className="dm-item-name">{item.name}</div>
                          <div className="dm-item-qty">Qty: {item.qty}</div>
                        </div>
                        <div className="dm-item-price">₹{(item.price * item.qty).toFixed(0)}</div>
                      </div>
                    ))
                  )}
                  <div className="dm-total-row">
                    <span className="dm-total-label">{order.cod === 1 ? "💵 COD Total" : "Total"}</span>
                    <span className="dm-total-val">₹{Number(order.amount).toFixed(0)}</span>
                  </div>
                </div>
              )}

              <div style={{ height: 120 }} />
            </div>
          </div>
        )}

        {/* Fixed bottom action button */}
        {order && (
          <div className="dm-action-bar">
            {isDelivered ? (
              <button className="dm-action-btn dm-action-btn-done" disabled>
                <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 20 }} />
                Order Delivered Successfully
              </button>
            ) : actionBtn ? (
              <button
                className={`dm-action-btn ${actionBtn.cls}`}
                disabled={updating}
                onClick={() => {
                  if (actionBtn.next === "delivered") {
                    handleDeliverClick();
                  } else {
                    updateStatus(actionBtn.next);
                  }
                }}
              >
                {updating ? "Updating…" : actionBtn.label}
              </button>
            ) : null}
          </div>
        )}

        {/* ── OTP Modal ── */}
        {showOtpModal && (
          <div className="dm-otp-overlay">
            <div className="dm-otp-sheet" style={{ position: 'relative' }}>

              {/* Success overlay */}
              {otpSuccess && (
                <div className="dm-otp-success-overlay">
                  <div className="dm-otp-success-icon">✅</div>
                  <div className="dm-otp-success-title">OTP Verified!</div>
                  <div className="dm-otp-success-sub">
                    Order delivered successfully<br />Please collect cash ₹{Number(order?.amount ?? 0).toFixed(0)}
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="dm-otp-header">
                <span className="dm-otp-header-icon">🔐</span>
                <div className="dm-otp-header-title">COD Delivery Verification</div>
                
                <div className="dm-otp-amount-badge">
                  <span className="dm-otp-amount-label">Collect Cash</span>
                  <span className="dm-otp-amount-val">₹{Number(order?.amount ?? 0).toFixed(0)}</span>
                </div>
              </div>

              <div className="dm-otp-body">

               

                {/* SMS status */}
                {otpSending && (
                  <div className="dm-otp-status-box dm-otp-status-sending">
                    <div className="dm-sms-spinner" />
                    <div className="dm-otp-status-text">
                      <div className="dm-otp-status-label">Sending SMS…</div>
                      <div className="dm-otp-status-sublabel">OTP is being sent to the customer's phone</div>
                    </div>
                  </div>
                )}
                {!otpSending && otpSent && (
                  <div className="dm-otp-status-box dm-otp-status-sent">
                    <div className="dm-otp-status-icon">✅</div>
                    <div className="dm-otp-status-text">
                      <div className="dm-otp-status-label">OTP Sent via SMS</div>
                      <div className="dm-otp-status-sublabel">
                        SMS sent to {order?.billing_phone} — ask the customer for the OTP
                      </div>
                    </div>
                  </div>
                )}
                {!otpSending && otpSendFailed && (
                  <div className="dm-otp-status-box dm-otp-status-failed">
                    <div className="dm-otp-status-icon">❌</div>
                    <div className="dm-otp-status-text">
                      <div className="dm-otp-status-label">Failed to send SMS</div>
                      <div className="dm-otp-status-sublabel">Press "Resend OTP" below to try again</div>
                    </div>
                  </div>
                )}

                {/* Hidden real input */}
                <input
                  ref={otpInputRef}
                  className="dm-otp-hidden-input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={4}
                  value={otpInput}
                  disabled={!otpSent || otpSending || otpSuccess}
                  onChange={handleOtpChange}
                  onFocus={() => setFocusedBox(Math.min(otpInput.length, 3))}
                  onBlur={() => setFocusedBox(-1)}
                />

                {/* Visual OTP boxes */}
                <div className="dm-otp-boxes-label">Enter customer OTP here</div>
                {renderOtpBoxes()}

                {/* Error message */}
                <div className="dm-otp-error-msg">{otpError}</div>

                

                {/* Resend */}
                <div className="dm-otp-resend-row">
                  <span style={{ fontSize: 12, color: '#64748b' }}>Didn't receive the OTP?</span>
                  {resendTimer > 0 ? (
                    <span className="dm-otp-resend-timer">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      className="dm-otp-resend-btn"
                      disabled={otpSending || otpSuccess}
                      onClick={requestOtp}
                    >
                      🔄 Resend OTP
                    </button>
                  )}
                </div>

                {/* Verify button */}
                <button
                  className="dm-otp-verify-btn"
                  disabled={otpInput.length !== 4 || updating || !otpSent || otpSuccess}
                  onClick={() => verifyAndDeliver()}
                >
                  {updating ? (
                    <>
                      <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                      Verifying…
                    </>
                  ) : (
                    '✅ Verify OTP & Complete Delivery'
                  )}
                </button>

                <button
                  className="dm-otp-cancel-btn"
                  disabled={otpSuccess}
                  onClick={() => setShowOtpModal(false)}
                >
                  Not now — Do it later
                </button>
              </div>
            </div>
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default DeliveryMap;