import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Scanner } from '@/components/Scanner';
import { StockList } from '@/components/StockList';
import { BarcodeConfirmation } from '@/components/BarcodeConfirmation';
import { ProductNotFoundDialog } from '@/components/ProductNotFoundDialog';
import { useStock } from '@/hooks/useStock';
import { useProducts } from '@/hooks/useProducts';
import { ProductFormData } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Scan } from 'lucide-react';

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

  return (
    <DashboardLayout 
      title="Contagem de Estoque" 
      showBackButton 
      backTo="/"
    >
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Lista de Stock */}
        <StockList 
          items={items}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearAll={clearAll}
        />
        
        <Scanner 
          onBarcodeScanned={handleBarcodeScanned}
          products={products}
          onProductSelect={async (product) => {
            setPendingBarcode(product.code);
          }}
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

        {/* Botão Flutuante para Scanner */}
        <div className="fixed bottom-6 left-6 z-40">
          <Button
            onClick={() => {
              const scannerButton = document.querySelector('[data-scanner-button]') as HTMLButtonElement;
              if (scannerButton) {
                scannerButton.click();
              }
            }}
            size="lg"
            className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-primary hover:scale-110"
            title="Iniciar Scanner"
          >
            <Scan className="w-8 h-8 text-primary-foreground" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Count;