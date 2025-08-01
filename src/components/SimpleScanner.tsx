import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useExternalScanner } from '@/hooks/useExternalScanner';
import { Product } from '@/types/product';

interface SimpleScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  products?: Product[];
  onProductSelect?: (product: Product) => void;
  onExternalModeChange?: (isExternal: boolean) => void;
}

export function SimpleScanner({ 
  onBarcodeScanned, 
  onExternalModeChange 
}: SimpleScannerProps) {
  const { 
    isExternalMode, 
    setIsExternalMode, 
    isListening, 
    startExternalScan, 
    stopExternalScan 
  } = useExternalScanner();

  // Escuta eventos do leitor externo
  useEffect(() => {
    const handleExternalScan = (event: any) => {
      console.log('Evento externalScanComplete recebido:', event.detail);
      if (isExternalMode && event.detail?.barcode) {
        console.log('Processando código:', event.detail.barcode);
        onBarcodeScanned(event.detail.barcode);
      }
    };

    window.addEventListener('externalScanComplete', handleExternalScan);
    return () => window.removeEventListener('externalScanComplete', handleExternalScan);
  }, [isExternalMode, onBarcodeScanned]);

  // Notifica mudança do modo externo
  useEffect(() => {
    onExternalModeChange?.(isExternalMode);
  }, [isExternalMode, onExternalModeChange]);

  const handleExternalToggle = (checked: boolean) => {
    console.log('Toggle leitor externo:', checked);
    setIsExternalMode(checked);
    if (!checked && isListening) {
      // Desativa ao desligar o leitor externo
      console.log('Parando leitor externo...');
      stopExternalScan();
    }
  };

  // Auto-ativa o leitor quando o modo externo é ligado
  useEffect(() => {
    if (isExternalMode && !isListening) {
      console.log('Modo externo ativado, iniciando leitor...');
      startExternalScan();
    }
  }, [isExternalMode, isListening, startExternalScan]);

  const handleStartExternalScan = () => {
    if (isExternalMode) {
      if (isListening) {
        stopExternalScan();
      } else {
        startExternalScan();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggle do Leitor Externo */}
      <Card className="border-accent/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-accent" />
              <div>
                <h3 className="font-semibold text-foreground">Leitor Externo</h3>
                <p className="text-sm text-muted-foreground">
                  Use adaptador de código de barras
                </p>
              </div>
            </div>
            <Switch
              checked={isExternalMode}
              onCheckedChange={handleExternalToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Área invisível para trigger do leitor externo quando ativo */}
      {isExternalMode && (
        <div 
          onClick={handleStartExternalScan}
          data-scanner-button
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
}