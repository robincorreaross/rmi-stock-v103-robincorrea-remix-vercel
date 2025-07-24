import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SimpleScanner } from '@/components/SimpleScanner';
import { StockList } from '@/components/StockList';
import { BarcodeConfirmation } from '@/components/BarcodeConfirmation';
import { ProductNotFoundDialog } from '@/components/ProductNotFoundDialog';
import { useStock } from '@/hooks/useStock';
import { useProducts } from '@/hooks/useProducts';
import { ProductFormData } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Scan, ArrowLeft, LogOut, Zap, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Count = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stockCountId = location.state?.stockCountId;

  // Função para tocar beep de sucesso
  const playSuccessBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const [showProductNotFound, setShowProductNotFound] = useState(false);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string>('');
  const [isExternalMode, setIsExternalMode] = useState(false);
  
  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearAll,
    exportToFile,
    isExporting,
    totalItems,
    totalQuantity
  } = useStock(stockCountId);

  const { 
    products,
    findProductByCode, 
    addProduct,
  } = useProducts();

  const handleBarcodeScanned = async (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    const product = await findProductByCode(barcode);
    
    if (!product) {
      setUnregisteredBarcode(barcode);
      setShowProductNotFound(true);
      return;
    }
    
    const existingItem = items.find(item => item.barcode === barcode);
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      addItem(barcode, 1);
    }
    
    playSuccessBeep();
  };

  const handleConfirmBarcode = () => {
    if (pendingBarcode) {
      const existingItem = items.find(item => item.barcode === pendingBarcode);
      
      if (existingItem) {
        updateQuantity(existingItem.id, existingItem.quantity + 1);
      } else {
        addItem(pendingBarcode, 1);
      }
      
      playSuccessBeep();
      setPendingBarcode(null);
    }
  };

  const handleCancelBarcode = () => {
    setPendingBarcode(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Contagem de Estoque</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Lista de Stock */}
        <StockList 
          items={items}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearAll={clearAll}
        />
        
        <SimpleScanner 
          onBarcodeScanned={handleBarcodeScanned}
          products={products}
          onProductSelect={async (product) => {
            setPendingBarcode(product.code);
          }}
          onExternalModeChange={setIsExternalMode}
        />

        {/* Modal de Confirmação */}
        {pendingBarcode && (
          <BarcodeConfirmation
            barcode={pendingBarcode}
            productDescription={undefined}
            onConfirm={handleConfirmBarcode}
            onCancel={handleCancelBarcode}
          />
        )}

        {/* Dialog de Produto Não Cadastrado */}
        <ProductNotFoundDialog
          open={showProductNotFound}
          barcode={unregisteredBarcode}
          onConfirm={(productData: ProductFormData) => {
            addProduct(productData);
            const existingItem = items.find(item => item.barcode === unregisteredBarcode);
            if (existingItem) {
              updateQuantity(existingItem.id, existingItem.quantity + 1);
            } else {
              addItem(unregisteredBarcode, 1);
            }
            playSuccessBeep();
            setShowProductNotFound(false);
          }}
          onCancel={() => setShowProductNotFound(false)}
          onSkip={() => {
            const existingItem = items.find(item => item.barcode === unregisteredBarcode);
            if (existingItem) {
              updateQuantity(existingItem.id, existingItem.quantity + 1);
            } else {
              addItem(unregisteredBarcode, 1);
            }
            playSuccessBeep();
            setShowProductNotFound(false);
          }}
        />

        {/* Botão Flutuante para Scanner/Leitor */}
        <div className="fixed bottom-6 left-6 z-40">
          <Button
            onClick={() => {
              if (!isExternalMode) {
                // Implementar lógica de scanner de câmera se necessário
                console.log('Scanner de câmera não implementado nesta versão simplificada');
              }
              // Não faz nada quando está em modo externo
            }}
            size="lg"
            className={`w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
              isExternalMode 
                ? 'bg-green-500 hover:bg-green-600 cursor-default' 
                : 'bg-gradient-primary hover:scale-110 cursor-pointer'
            }`}
            title={isExternalMode ? "Leitor Externo Ativo" : "Iniciar Scanner"}
            disabled={isExternalMode}
          >
            {isExternalMode ? (
              <Zap className="w-8 h-8 text-white" />
            ) : (
              <Scan className="w-8 h-8 text-primary-foreground" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Count;