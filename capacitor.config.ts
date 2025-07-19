import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a5da0fdb40fc44cc9864fa91c25cf605',
  appName: 'rmi-stock-v103-robincorrea-test-vercel',
  webDir: 'dist',
  server: {
    url: 'https://a5da0fdb-40fc-44cc-9864-fa91c25cf605.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    }
  }
};

export default config;