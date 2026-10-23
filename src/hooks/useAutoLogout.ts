import { useEffect, useRef } from 'react';

/**
 * Blinkit-style auto-logout:
 * Jab delivery boy ek order "delivered" mark kare, ek 20-min timer
 * shuru ho jata hai. Agar wo naya order accept kar leta hai to
 * timer cancel ho jata hai. Agar 20 min tak koi naya order accept
 * nahi hota (aur app open rehta hai), to auto-logout ho jata hai.
 *
 * Isko localStorage me rakha hai (interval CHECK_INTERVAL par
 * poll hota hai) taaki App restart/navigate hone par bhi timer
 * yaad rahe, jab tak app process open hai.
 */

const TIMER_KEY = 'delivery_last_delivered_at';
const AUTO_LOGOUT_MS = 5 * 60 * 1000; // 5 minutes
const CHECK_INTERVAL_MS = 15 * 1000; // check every 15s

/** Order "delivered" mark hone ke baad call karo (e.g. OrderDetail.tsx me) */
export function markOrderDelivered() {
  localStorage.setItem(TIMER_KEY, Date.now().toString());
}

/** Naya order accept/assign hone par call karo, taaki timer cancel ho jaye */
export function clearAutoLogoutTimer() {
  localStorage.removeItem(TIMER_KEY);
}

/** Kitna time bacha hai (ms), null agar timer active nahi hai */
export function getAutoLogoutRemainingMs(): number | null {
  const ts = localStorage.getItem(TIMER_KEY);
  if (!ts) return null;
  const elapsed = Date.now() - parseInt(ts, 10);
  const remaining = AUTO_LOGOUT_MS - elapsed;
  return remaining > 0 ? remaining : 0;
}

/**
 * App ke root/layout component me ek baar use karo:
 *
 *   useAutoLogout(async () => {
 *     try { await apiPost('logout', {}); } catch {}
 *     localStorage.removeItem('auth_token');
 *     localStorage.removeItem('auth_user');
 *     // navigate to Login page
 *   });
 */
export function useAutoLogout(onTimeout: () => void) {
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    const interval = setInterval(() => {
      const ts = localStorage.getItem(TIMER_KEY);
      if (!ts) return;

      const elapsed = Date.now() - parseInt(ts, 10);
      if (elapsed >= AUTO_LOGOUT_MS) {
        clearAutoLogoutTimer();
        onTimeoutRef.current();
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
}