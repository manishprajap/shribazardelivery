import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { apiPost } from '../api';

// Optional: tap hone par navigate karne ke liye callback register karo
let navigateCallback: ((data: any) => void) | null = null;
export const setFcmNavigateHandler = (cb: (data: any) => void) => {
  navigateCallback = cb;
};

export const useFCM = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initMobilePush();
    } else {
      initWebPush();
    }
  }, []);

  // ✅ Mobile: Android / iOS
  const initMobilePush = async () => {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return;

    // Local notification permission bhi lo (foreground display ke liye)
    await LocalNotifications.requestPermissions();

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      saveTokenToBackend(token.value, 'mobile');
    });

    // ✅ APP OPEN (foreground) me notification aayi
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Foreground notification:', notification);

      // Foreground me system khud notification nahi dikhata,
      // isliye local notification manually schedule karo
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147483647,
            title: notification.title || 'New Notification',
            body: notification.body || '',
            extra: notification.data || {},
            smallIcon: 'ic_stat_notify',
            channelId: 'default_channel',
          },
        ],
      });
    });

    // ✅ Notification tap hone par (app background/closed se open hua)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action.notification.data;
      console.log('Push tapped:', data);
      if (navigateCallback && data) navigateCallback(data);
    });

    // ✅ Local notification tap (foreground wala) — isko bhi navigate se connect karo
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const data = action.notification.extra;
      console.log('Local notification tapped:', data);
      if (navigateCallback && data) navigateCallback(data);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('FCM Registration error:', err);
    });
  };

  // ✅ Web Browser
  const initWebPush = async () => {
    try {
      const { initializeApp } = await import('firebase/app');
      const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

      const firebaseApp = initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      });

      const messaging = getMessaging(firebaseApp);

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });

      if (token) {
        saveTokenToBackend(token, 'web');
      }

      onMessage(messaging, (payload) => {
        console.log('Web foreground message:', payload);
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'New Notification', {
            body: payload.notification?.body,
            icon: '/shrilogo.jpeg',
          });
        }
      });

    } catch (error) {
      console.error('Web push error:', error);
    }
  };

  const saveTokenToBackend = async (token: string, platform: string) => {
    localStorage.setItem('pending_fcm_token', token);
    localStorage.setItem('pending_fcm_platform', platform);

    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      console.warn('User not logged in yet, FCM token cached for later sync');
      return;
    }

    try {
      await apiPost('save-fcm-token', { fcm_token: token, platform });
      console.log('FCM token saved');
      localStorage.removeItem('pending_fcm_token');
      localStorage.removeItem('pending_fcm_platform');
    } catch (error) {
      console.error('Token save error:', error);
    }
  };
};

export const syncPendingFcmToken = async () => {
  const authToken = localStorage.getItem('auth_token');
  const token = localStorage.getItem('pending_fcm_token');
  const platform = localStorage.getItem('pending_fcm_platform');

  if (!authToken || !token) return;

  try {
    await apiPost('save-fcm-token', { fcm_token: token, platform });
    console.log('FCM token synced after login');
    localStorage.removeItem('pending_fcm_token');
    localStorage.removeItem('pending_fcm_platform');
  } catch (error) {
    console.error('FCM token sync error:', error);
  }
};