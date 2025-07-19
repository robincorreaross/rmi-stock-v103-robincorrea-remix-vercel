
import { useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { ScanResult } from '@/types/stock';
import { useToast } from './use-toast';

export function useHybridBarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const isNative = false; // Always use web scanner for deployment compatibility

  const checkWebPermission = async (): Promise<boolean> => {
    try {
      // Tentar acesso mais rápido com configurações básicas primeiro
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment'
        } 
      });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Erro de permissão da câmera:', error);
      toast({
        title: "Permissão necessária",
        description: "Por favor, permita o acesso à câmera para usar o scanner.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Native scanner removed for web deployment compatibility

  const startWebScan = async (onSuccess: (result: string) => void): Promise<void> => {
    const hasPermission = await checkWebPermission();
    if (!hasPermission) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      // Configurações otimizadas para inicialização mais rápida
      const config = {
        fps: 10, // Reduzido para inicialização mais rápida
        qrbox: { width: 250, height: 120 }, // Área otimizada para códigos de barras
        aspectRatio: 2.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: "environment"
        }
      };

      // Uso direto da câmera traseira sem busca detalhada para ser mais rápido
      const cameraConfig = { facingMode: "environment" };

      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText) => {
          console.log('Código lido:', decodedText);
          onSuccess(decodedText);
          stopScan();
        },
        (errorMessage) => {
          // Silenciar erros de scan contínuo
          console.debug('Tentativa de scan:', errorMessage);
        }
      );
    } catch (error) {
      console.error('Erro ao iniciar scanner web:', error);
      toast({
        title: "Erro no scanner",
        description: "Não foi possível iniciar o scanner da câmera.",
        variant: "destructive"
      });
    }
  };

  // Native scanner removed for web deployment compatibility

  const startScan = async (onSuccess?: (result: string) => void): Promise<ScanResult | null> => {
    if (isScanning) {
      await stopScan();
      return null;
    }

    setIsScanning(true);

    // Always use web scanner (camera) for deployment compatibility
    if (onSuccess) {
      await startWebScan((decodedText) => {
        toast({
          title: "Código escaneado!",
          description: `Código: ${decodedText}`,
          variant: "default"
        });
        onSuccess(decodedText);
        setIsScanning(false);
      });
    }
    return null;
  };

  const stopScan = async () => {
    try {
      setIsScanning(false);
      
      // Always use web scanner cleanup
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }
    } catch (error) {
      console.error('Erro ao parar o scan:', error);
    }
  };

  return {
    isScanning,
    startScan,
    stopScan,
    isNative
  };
}
