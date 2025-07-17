
import { useState, useEffect } from 'react';
import { Scan, Square, Keyboard, Smartphone, Monitor, X, Lightbulb, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useHybridBarcodeScanner } from '@/hooks/useHybridBarcodeScanner';
import { useExternalScanner } from '@/hooks/useExternalScanner';
import { ProductAutocomplete } from '@/components/ProductAutocomplete';
import { Product } from '@/types/product';

interface ScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  products?: Product[];
  onProductSelect?: (product: Product) => void;
}

export function Scanner({ onBarcodeScanned, products = [], onProductSelect }: ScannerProps) {
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showTips, setShowTips] = useState(false);
  
  const { isScanning, startScan, stopScan, isNative } = useHybridBarcodeScanner();
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
      if (isExternalMode && event.detail?.barcode) {
        onBarcodeScanned(event.detail.barcode);
        stopExternalScan();
      }
    };

    window.addEventListener('externalScanComplete', handleExternalScan);
    return () => window.removeEventListener('externalScanComplete', handleExternalScan);
  }, [isExternalMode, onBarcodeScanned, stopExternalScan]);

  const handleScanPress = async () => {
    if (isExternalMode) {
      // Modo leitor externo
      if (isListening) {
        stopExternalScan();
      } else {
        startExternalScan();
      }
      return;
    }

    // Modo câmera (código existente)
    if (isScanning) {
      await stopScan();
      setShowFullScreen(false);
      return;
    }

    setShowFullScreen(true);

    if (isNative) {
      const result = await startScan();
      setShowFullScreen(false);
      if (result && !result.cancelled && result.text) {
        onBarcodeScanned(result.text);
      }
    } else {
      await startScan((barcode) => {
        onBarcodeScanned(barcode);
        setShowFullScreen(false);
      });
    }
  };

  const handleStopScan = async () => {
    if (isExternalMode) {
      stopExternalScan();
    } else {
      await stopScan();
      setShowFullScreen(false);
    }
  };

  // Previne scroll quando em fullscreen
  useEffect(() => {
    if (showFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFullScreen]);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onBarcodeScanned(manualInput.trim());
      setManualInput('');
      setShowManualInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  };

  const getScannerStatus = () => {
    if (isExternalMode) {
      return isListening ? 'Leitor externo ativo' : 'Leitor externo inativo';
    }
    return isScanning ? 'Scanner ativo - tela cheia' : 'Toque para iniciar o scanner';
  };

  return (
    <>
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
                onCheckedChange={setIsExternalMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Indicador do modo de operação */}
        <div className="flex justify-center">
          <Badge variant={isExternalMode ? "default" : (isNative ? "default" : "secondary")} className="flex items-center space-x-1">
            {isExternalMode ? (
              <>
                <Zap className="w-4 h-4" />
                <span>Modo Leitor Externo</span>
              </>
            ) : (
              <>
                {isNative ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                <span>{isNative ? 'Modo Mobile' : 'Modo Navegador'}</span>
              </>
            )}
          </Badge>
        </div>

        {/* Scanner Principal */}
        <Card className="border-2 border-primary/20 shadow-card bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-primary">
              {isExternalMode ? (
                <Zap className="w-10 h-10 text-primary-foreground" />
              ) : (
                <Scan className="w-10 h-10 text-primary-foreground" />
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {isExternalMode ? 'Leitor de Código Externo' : 'Scanner de Código de Barras'}
              </h2>
              <p className="text-muted-foreground">
                {getScannerStatus()}
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                variant="scanner" 
                size="lg" 
                onClick={handleScanPress}
                className="w-full text-lg py-6"
                disabled={false}
              >
                {(isExternalMode && isListening) || (!isExternalMode && isScanning) ? (
                  <>
                    <Square className="w-6 h-6 mr-2" />
                    Parar {isExternalMode ? 'Leitor' : 'Scanner'}
                  </>
                ) : (
                  <>
                    {isExternalMode ? <Zap className="w-6 h-6 mr-2" /> : <Scan className="w-6 h-6 mr-2" />}
                    Iniciar {isExternalMode ? 'Leitor' : 'Scanner'}
                  </>
                )}
              </Button>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="flex-1"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Inserir código
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setShowTips(!showTips)}
                  className="px-3"
                >
                  <Lightbulb className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dicas para melhorar a leitura */}
        {showTips && (
          <Card className="border-accent/30">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-accent" />
                {isExternalMode ? 'Dicas para leitor externo:' : 'Dicas para melhor leitura:'}
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                {isExternalMode ? (
                  <>
                    <li>• Conecte o leitor via USB ou Bluetooth</li>
                    <li>• Configure o leitor para modo "teclado"</li>
                    <li>• Aponte o leitor diretamente para o código</li>
                    <li>• Mantenha distância de 5-10cm do código</li>
                    <li>• Certifique-se que o código está limpo</li>
                    <li>• O leitor deve estar configurado para adicionar Enter no final</li>
                  </>
                ) : (
                  <>
                    <li>• Mantenha o código de barras bem iluminado</li>
                    <li>• Posicione a câmera a 10-15cm do código</li>
                    <li>• Mantenha o dispositivo estável</li>
                    <li>• Certifique-se que o código está limpo e não danificado</li>
                    <li>• Para códigos pequenos, aproxime mais a câmera</li>
                    <li>• Evite reflexos e sombras sobre o código</li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Input Manual com Autocomplete */}
        {showManualInput && (
          <Card className="border-accent/30">
            <CardContent className="p-4 space-y-3">
              <ProductAutocomplete
                value={manualInput}
                onChange={setManualInput}
                onProductSelect={(product) => {
                  onProductSelect?.(product);
                  onBarcodeScanned(product.code);
                  setManualInput('');
                  setShowManualInput(false);
                }}
                onSubmit={handleManualSubmit}
                placeholder="Digite código ou nome do produto..."
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overlay Full Screen para Scanner - apenas para modo câmera */}
      {showFullScreen && !isExternalMode && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Header com botão fechar */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary to-primary/80">
            <h2 className="text-primary-foreground text-lg font-semibold">Scanner de Código</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStopScan}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Área do scanner */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            {!isNative && (
              <div className="w-full max-w-md mb-6">
                <div 
                  id="qr-reader" 
                  className="w-full border-2 border-white/30 rounded-lg overflow-hidden"
                  style={{ minHeight: '300px' }}
                />
              </div>
            )}
            
            <div className="text-center space-y-4">
              <div className="w-32 h-20 border-4 border-white/50 border-dashed rounded-xl flex items-center justify-center mx-auto">
                <Scan className="w-12 h-12 text-white" />
              </div>
              
              <div>
                <h3 className="text-white text-xl font-semibold mb-2">
                  Aponte para o código de barras
                </h3>
                <p className="text-white/70 text-sm max-w-sm mx-auto">
                  {isNative 
                    ? 'Mantenha o código centralizado e bem iluminado' 
                    : 'Posicione o código dentro da área de leitura acima'
                  }
                </p>
                <p className="text-white/50 text-xs mt-2">
                  Distância ideal: 10-15cm do código
                </p>
              </div>
            </div>
          </div>

          {/* Footer com botão parar */}
          <div className="p-6 bg-black/50">
            <Button
              variant="outline"
              onClick={handleStopScan}
              className="w-full text-white border-white/30 hover:bg-white/20"
            >
              <Square className="w-5 h-5 mr-2" />
              Parar Scanner
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
