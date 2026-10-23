import React, { useEffect, useRef } from 'react';
import { IonModal, IonButton, IonIcon } from '@ionic/react';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';
import { IncomingOrderData } from '../hooks/useIncomingOrder';

interface Props {
  order: IncomingOrderData | null;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
}

const IncomingOrderModal: React.FC<Props> = ({ order, onAccept, onReject }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handledQuickAction = useRef(false);

  useEffect(() => {
    if (order) {
      // Native ring (RingtoneService) already plays for closed/background app.
      // This web audio covers the case where the WebView itself is visibly
      // in foreground and native ring was skipped/stopped already.
      audioRef.current = new Audio('/assets/ringtone.mp3');
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {});

      // ✅ FIX: if user tapped Accept/Reject directly on the Android
      // notification, honor that immediately instead of re-showing
      // the modal and waiting for another tap.
      if (order.quickAction && !handledQuickAction.current) {
        handledQuickAction.current = true;
        stopRing();
        if (order.quickAction === 'accept') onAccept(order.orderId);
        else onReject(order.orderId);
        return;
      }
    } else {
      handledQuickAction.current = false;
    }

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [order]);

  const stopRing = () => {
    audioRef.current?.pause();
    audioRef.current = null;
  };

  if (!order || order.quickAction) return null;

  return (
    <IonModal isOpen={!!order} backdropDismiss={false}>
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', padding: 24,
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>New Order!</h2>
        <p style={{ opacity: 0.85, marginBottom: 24 }}>Order #{order.orderId}</p>

        <div style={{
          background: 'rgba(255,255,255,0.15)', borderRadius: 16,
          padding: 20, width: '100%', maxWidth: 340, marginBottom: 32,
        }}>
          <p style={{ fontWeight: 600, fontSize: 16 }}>{order.customerName}</p>
          <p style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>{order.address}</p>
          <p style={{ fontSize: 20, fontWeight: 700, marginTop: 12 }}>₹{order.amount}</p>
        </div>

        <div style={{ display: 'flex', gap: 20, width: '100%', maxWidth: 340 }}>
          <IonButton
            expand="block"
            color="danger"
            style={{ flex: 1 }}
            onClick={() => { stopRing(); onReject(order.orderId); }}
          >
            <IonIcon icon={closeCircle} slot="start" /> Reject
          </IonButton>

          <IonButton
            expand="block"
            color="light"
            style={{ flex: 1 }}
            onClick={() => { stopRing(); onAccept(order.orderId); }}
          >
            <IonIcon icon={checkmarkCircle} slot="start" /> Accept
          </IonButton>
        </div>
      </div>
    </IonModal>
  );
};

export default IncomingOrderModal;