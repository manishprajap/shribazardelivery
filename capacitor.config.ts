import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'delivery-rider',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'], // iOS: foreground me bhi banner/sound/badge dikhao
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_notify', // Android status bar icon (drawable folder me hona chahiye)
      iconColor: '#f97316',        // aapka brand orange
      sound: 'default',
    },
  },
};

export default config;