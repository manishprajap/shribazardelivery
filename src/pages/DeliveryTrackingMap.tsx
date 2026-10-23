/**
 * DeliveryTrackingMap.tsx
 * Delivery boy's navigation screen:
 *  • Live GPS blue dot (updates every 10 s → pushed to backend)
 *  • Warehouse orange pin
 *  • Google Directions route between the two
 *  • Distance + ETA cards
 */

import React, {
  FC,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { IonIcon, IonSpinner, IonToast } from '@ionic/react';
import {
  navigateOutline,
  locationOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { apiPost } from '../api';

// ─── Extend Window for Google Maps ────────────────────────────
declare global {
  interface Window {
    initGoogleMaps: () => void;
    google: GoogleMapsNamespace;
  }
}

// ─── Minimal Google Maps type shims ───────────────────────────
// Avoids @types/google.maps while keeping ESLint happy (no `any`)
interface GLatLng {
  lat(): number;
  lng(): number;
}
interface GLatLngLiteral { lat: number; lng: number }
type GSize = object
type GPoint = object
interface GLatLngBounds {
  extend(pos: GLatLngLiteral): void;
}
interface GMap {
  fitBounds(bounds: GLatLngBounds, padding: { top: number; bottom: number; left: number; right: number }): void;
}
interface GMarker {
  setPosition(pos: GLatLng): void;
}
interface GDirectionsRenderer {
  setDirections(result: GDirectionsResult): void;
}
interface GDirectionsLeg {
  distance?: { value: number };
}
interface GDirectionsRoute {
  legs: GDirectionsLeg[];
}
interface GDirectionsResult {
  routes: GDirectionsRoute[];
}
type GDirectionsStatus = string;
type GTravelMode = string;

interface GoogleMapsNamespace {
  maps: {
    Map: new (el: HTMLElement, opts: object) => GMap;
    Marker: new (opts: object) => GMarker;
    Size: new (w: number, h: number) => GSize;
    Point: new (x: number, y: number) => GPoint;
    LatLng: new (lat: number, lng: number) => GLatLng;
    LatLngBounds: new () => GLatLngBounds;
    DirectionsService: new () => {
      route(
        request: object,
        callback: (result: GDirectionsResult | null, status: GDirectionsStatus) => void
      ): void;
    };
    DirectionsRenderer: new (opts: object) => GDirectionsRenderer;
    DirectionsStatus: { OK: GDirectionsStatus };
    TravelMode: { DRIVING: GTravelMode };
  };
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCYYrgKJKlHVt_Ew1KUl5ToHZdO3LP3zwU';
const LOCATION_PUSH_INTERVAL = 10_000; // ms

// ─── Local types ──────────────────────────────────────────────
interface LatLng {
  lat: number;
  lng: number;
}

interface StatCard {
  label: string;
  value: string;
  color: string;
}

interface ToastState {
  open: boolean;
  msg: string;
  ok: boolean;
}

export interface DeliveryTrackingMapProps {
  orderId: number;
  warehouseLat: number;
  warehouseLng: number;
  warehouseLabel?: string;
  onClose?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────
function haversine(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function etaString(km: number): string {
  const mins = Math.round((km / 25) * 60);
  if (mins < 1) return 'Almost there!';
  if (mins < 60) return `~${mins} min`;
  return `~${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const WAREHOUSE_SVG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
    <path d="M20 0C9 0 0 9 0 20c0 15 20 28 20 28S40 35 40 20C40 9 31 0 20 0z" fill="#FF5722"/>
    <text x="20" y="26" text-anchor="middle" font-size="18">🏪</text>
  </svg>`
)}`;

const MY_DOT_SVG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#fff" stroke-width="3"/>
    <circle cx="12" cy="12" r="4" fill="#fff"/>
  </svg>`
)}`;

// ─── Component ────────────────────────────────────────────────
const DeliveryTrackingMap: FC<DeliveryTrackingMapProps> = ({
  orderId,
  warehouseLat,
  warehouseLng,
  warehouseLabel = 'Warehouse / Vendor',
  onClose,
}) => {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMap | null>(null);
  const myMarkerRef = useRef<GMarker | null>(null);
  const rendererRef = useRef<GDirectionsRenderer | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestPosRef = useRef<LatLng | null>(null);

  const [myPos, setMyPos] = useState<LatLng | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState('');
  const [toast, setToast] = useState<ToastState>({ open: false, msg: '', ok: true });

  // ✅ Stable object — prevents useCallback deps changing every render
  const warehouse = useMemo<LatLng>(
    () => ({ lat: warehouseLat, lng: warehouseLng }),
    [warehouseLat, warehouseLng]
  );

  // ── 1. Load Google Maps SDK ───────────────────────────────────
  useEffect(() => {
    if (window.google?.maps) { setMapReady(true); return; }
    window.initGoogleMaps = () => setMapReady(true);
    if (!document.getElementById('gmap-sdk')) {
      const s = document.createElement('script');
      s.id = 'gmap-sdk';
      s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initGoogleMaps`;
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  // ── 2. Build map once SDK is ready ───────────────────────────
  useEffect(() => {
    if (!mapReady || !mapElRef.current || mapRef.current) return;

    const G = window.google.maps;

    const map = new G.Map(mapElRef.current, {
      center: { lat: warehouse.lat, lng: warehouse.lng },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });

    new G.Marker({
      position: { lat: warehouse.lat, lng: warehouse.lng },
      map,
      title: warehouseLabel,
      icon: {
        url: WAREHOUSE_SVG,
        scaledSize: new G.Size(40, 48),
        anchor: new G.Point(20, 48),
      },
    });

    rendererRef.current = new G.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#FF5722', strokeWeight: 4, strokeOpacity: 0.85 },
    });

    mapRef.current = map;

    if (latestPosRef.current) {
      placeMyMarker(latestPosRef.current, map);
      requestRoute(latestPosRef.current, map);
    }
  }, [mapReady, warehouse, warehouseLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers that need map reference ──────────────────────────
  const placeMyMarker = (pos: LatLng, map: GMap) => {
    const G = window.google.maps;
    const gPos = new G.LatLng(pos.lat, pos.lng);
    if (!myMarkerRef.current) {
      myMarkerRef.current = new G.Marker({
        position: gPos,
        map,
        title: 'You are here',
        icon: {
          url: MY_DOT_SVG,
          scaledSize: new G.Size(24, 24),
          anchor: new G.Point(12, 12),
        },
      });
    } else {
      myMarkerRef.current.setPosition(gPos);
    }
  };

  const requestRoute = useCallback((pos: LatLng, map: GMap) => {
    if (!window.google?.maps || !rendererRef.current) return;
    const G = window.google.maps;

    new G.DirectionsService().route(
      {
        origin: { lat: pos.lat, lng: pos.lng },
        destination: { lat: warehouse.lat, lng: warehouse.lng },
        travelMode: G.TravelMode.DRIVING,
      },
      (result: GDirectionsResult | null, status: GDirectionsStatus) => {
        if (status === G.DirectionsStatus.OK && result !== null && rendererRef.current) {
          rendererRef.current.setDirections(result);
          const meters = result.routes[0]?.legs[0]?.distance?.value;
          if (meters !== undefined) setDistance(meters / 1000);
        } else {
          setDistance(haversine(pos, warehouse));
        }
      }
    );

    const bounds = new G.LatLngBounds();
    bounds.extend({ lat: pos.lat, lng: pos.lng });
    bounds.extend({ lat: warehouse.lat, lng: warehouse.lng });
    map.fitBounds(bounds, { top: 80, bottom: 80, left: 40, right: 40 });
  }, [warehouse]);

  // ── 3. Backend location push ──────────────────────────────────
  const pushLocation = useCallback(async (pos: LatLng) => {
    try {
      await apiPost('/delivery/update-location', {
        latitude: pos.lat,
        longitude: pos.lng,
        order_id: orderId,
      });
    } catch {
      // Silent — retry next interval
    }
  }, [orderId]);

  // ── 4. GPS watch ──────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS is not available on this device');
      setGpsLoading(false);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position: GeolocationPosition) => {
        const pos: LatLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        latestPosRef.current = pos;
        setMyPos(pos);
        setGpsLoading(false);
        setGpsError('');

        const map = mapRef.current;
        if (map) {
          placeMyMarker(pos, map);
          requestRoute(pos, map);
        }
      },
      (err: GeolocationPositionError) => {
        setGpsError(`GPS Error: ${err.message}`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [requestRoute]); 

  // ── 5. Periodic backend push ──────────────────────────────────
  useEffect(() => {
    if (!myPos) return;
    pushLocation(myPos);
    pushTimerRef.current = setInterval(() => {
      if (latestPosRef.current) pushLocation(latestPosRef.current);
    }, LOCATION_PUSH_INTERVAL);
    return () => {
      if (pushTimerRef.current) clearInterval(pushTimerRef.current);
    };
  }, [myPos, pushLocation]);

  // ─── Render ───────────────────────────────────────────────────
  const dist = distance;
  const eta = dist !== null ? etaString(dist) : null;

  const statCards: StatCard[] = [
    { label: 'DISTANCE', value: dist !== null ? `${dist.toFixed(1)} km` : '—', color: '#F1F5F9' },
    { label: 'ETA', value: eta ?? '—', color: '#FF5722' },
    {
      label: 'GPS',
      value: myPos ? '✓ Active' : gpsLoading ? 'Locating…' : '✗ Error',
      color: myPos ? '#22C55E' : '#F59E0B',
    },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', background: '#0F172A' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '48px 16px 14px', background: '#1E293B', borderBottom: '1px solid #334155' }}>
        {onClose && (
          <button onClick={onClose} style={{ background: '#334155', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#94A3B8', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            ✕ Back
          </button>
        )}
        <IonIcon icon={navigateOutline} style={{ fontSize: 20, color: '#FF5722' }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>Pickup Navigation</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>Order #{orderId} · {warehouseLabel}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#22C55E' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', animation: 'blink 1.5s infinite' }} />
          Live
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: '#1E293B' }}>
        {statCards.map((c) => (
          <div key={c.label} style={{ flex: 1, background: '#0F172A', borderRadius: 12, padding: '10px 12px', border: '1px solid #334155' }}>
            <div style={{ fontSize: 9, color: '#64748B', marginBottom: 3, letterSpacing: 1 }}>{c.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        {(gpsLoading || !mapReady) && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0F172A', gap: 12 }}>
            <IonSpinner name="crescent" color="primary" />
            <div style={{ fontSize: 13, color: '#64748B' }}>{!mapReady ? 'Loading map…' : 'Finding your GPS location…'}</div>
          </div>
        )}
        {gpsError.length > 0 && !gpsLoading && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: '#FEE2E2', borderRadius: 12, padding: '8px 16px', fontSize: 12, color: '#DC2626', whiteSpace: 'nowrap' }}>
            {gpsError}
          </div>
        )}
        <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* ── Footer ── */}
      <div style={{ background: '#1E293B', borderTop: '1px solid #334155', padding: '12px 16px 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FF572220', border: '1px solid #FF572240', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IonIcon icon={locationOutline} style={{ fontSize: 18, color: '#FF5722' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{warehouseLabel}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>Pick up the order from this location</div>
        </div>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

      <IonToast
        isOpen={toast.open}
        message={toast.msg}
        duration={2000}
        color={toast.ok ? 'success' : 'danger'}
        icon={toast.ok ? checkmarkCircleOutline : alertCircleOutline}
        onDidDismiss={() => setToast((p) => ({ ...p, open: false }))}
      />
    </div>
  );
};

export default DeliveryTrackingMap;