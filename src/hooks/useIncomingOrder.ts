import { useEffect, useState, useCallback } from 'react';

export interface IncomingOrderData {
  orderId: string;
  customerName: string;
  address: string;
  amount: string;
  quickAction?: 'accept' | 'reject' | null;
}

export function useIncomingOrder() {
  const [incomingOrder, setIncomingOrder] = useState<IncomingOrderData | null>(null);

  const dismiss = useCallback(() => setIncomingOrder(null), []);

  useEffect(() => {
    // ✅ FIX: Capacitor's PushNotifications MessagingService was removed
    // in AndroidManifest.xml (replaced by our own IncomingOrderMessagingService),
    // so 'pushNotificationReceived' / 'pushNotificationActionPerformed'
    // NEVER fire. Removed that dead code. The only real path is the
    // native 'incomingOrder' window event dispatched from MainActivity.
    const handleNativeEvent = (e: any) => {
      setIncomingOrder(e.detail);
    };

    window.addEventListener('incomingOrder', handleNativeEvent);

    return () => {
      window.removeEventListener('incomingOrder', handleNativeEvent);
    };
  }, []);

  return { incomingOrder, dismiss };
}