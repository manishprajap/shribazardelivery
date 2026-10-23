importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyATEWavqLcYZdPnfJlRMyDIGDxxzy_D0BA",
  authDomain: "shri-bazar.firebaseapp.com",
  projectId: "shri-bazar",
  storageBucket: "shri-bazar.firebasestorage.app",
  messagingSenderId: "232976247567",
  appId: "1:232976247567:web:d8c7648707270f60766c7a",
  measurementId: "G-TFD1E8G0RQ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/logo.png'
  });
});