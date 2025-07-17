import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.fac9ffa861764afdad2d6155d0a5aaad',
  appName: 'StockCounter - Contador de Estoque',
  webDir: 'dist',
  server: {
    url: 'https://fac9ffa8-6176-4afd-ad2d-6155d0a5aaad.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    BarcodeScanner: {
      scanType: 'camera',
      showBackground: true,
      showTorchButton: true
    }
  }
};

export default config;