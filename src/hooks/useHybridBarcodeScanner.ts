
import { useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { ScanResult } from '@/types/stock';
import { useToast } from './use-toast';

export function useHybridBarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const isNative = Capacitor.isNativePlatform();

  const checkWebPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
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

  const checkNativePermission = async (): Promise<boolean> => {
    try {
      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (status.granted) {
        return true;
      }

      if (status.denied) {
        toast({
          title: "Permissão negada",
          description: "Por favor, permita o acesso à câmera nas configurações do app.",
          variant: "destructive"
        });
        return false;
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar permissão nativa:', error);
      return false;
    }
  };

  const startWebScan = async (onSuccess: (result: string) => void): Promise<void> => {
    const hasPermission = await checkWebPermission();
    if (!hasPermission) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      // Configurações otimizadas para melhor leitura
      const config = {
        fps: 15, // Aumentado para melhor responsividade
        qrbox: { width: 300, height: 150 }, // Área otimizada para códigos de barras
        aspectRatio: 2.0, // Melhor para códigos de barras horizontais
        disableFlip: false,
        videoConstraints: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          focusMode: "continuous"
        }
      };

      // Tenta usar a câmera traseira primeiro
      let cameraId;
      try {
        const cameras = await Html5Qrcode.getCameras();
        // Procura por câmera traseira
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        );
        cameraId = backCamera ? backCamera.id : cameras[0]?.id;
      } catch (e) {
        console.log('Usando configuração de câmera padrão');
        cameraId = { facingMode: "environment" };
      }

      await html5QrCode.start(
        cameraId || { facingMode: "environment" },
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

  const startNativeScan = async (): Promise<ScanResult | null> => {
    const allowed = await checkNativePermission();
    if (!allowed) return null;

    try {
      document.body.classList.add('scanner-active');
      await BarcodeScanner.hideBackground();
      
      // Configurações otimizadas para o scanner nativo
      const result = await BarcodeScanner.startScan({
        targetedFormats: ['QR_CODE', 'EAN_13', 'EAN_8', 'CODE_128', 'CODE_39', 'UPC_A', 'UPC_E'],
        cameraDirection: 'back'
      });
      
      if (result.hasContent) {
        console.log('Código lido (nativo):', result.content);
        return {
          cancelled: false,
          text: result.content,
          format: result.format
        };
      }
      
      return { cancelled: true };
    } catch (error) {
      console.error('Erro durante o scan nativo:', error);
      toast({
        title: "Erro no scanner",
        description: "Não foi possível escanear o código de barras.",
        variant: "destructive"
      });
      return { cancelled: true };
    } finally {
      document.body.classList.remove('scanner-active');
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
    }
  };

  const startScan = async (onSuccess?: (result: string) => void): Promise<ScanResult | null> => {
    if (isScanning) {
      await stopScan();
      return null;
    }

    setIsScanning(true);

    if (isNative) {
      // Modo nativo (iOS/Android)
      const result = await startNativeScan();
      setIsScanning(false);
      
      if (result && !result.cancelled && result.text) {
        toast({
          title: "Código escaneado!",
          description: `Código: ${result.text}`,
          variant: "default"
        });
      }
      
      return result;
    } else {
      // Modo web (navegador)
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
    }
  };

  const stopScan = async () => {
    try {
      setIsScanning(false);
      
      if (isNative) {
        document.body.classList.remove('scanner-active');
        await BarcodeScanner.showBackground();
        await BarcodeScanner.stopScan();
      } else {
        if (scannerRef.current) {
          await scannerRef.current.stop();
          scannerRef.current = null;
        }
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
