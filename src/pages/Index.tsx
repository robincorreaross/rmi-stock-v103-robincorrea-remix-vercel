
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Scanner } from '@/components/Scanner';
import { StockList } from '@/components/StockList';
import { BarcodeConfirmation } from '@/components/BarcodeConfirmation';
import { ProductNotFoundDialog } from '@/components/ProductNotFoundDialog';
import { ProductForm } from '@/components/ProductForm';
import { ProductList } from '@/components/ProductList';
import { ProductImport } from '@/components/ProductImport';
import { useStock } from '@/hooks/useStock';
import { useProducts } from '@/hooks/useProducts';
import { ProductFormData, Product } from '@/types/product';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, BarChart3, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  // Add console log to track component mounting
  useEffect(() => {
    console.log('Index component mounted');
  }, []);

  // Função para tocar beep de sucesso
  const playSuccessBeep = () => {
    // Cria um beep usando AudioContext
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Tom agudo
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const [showProductNotFound, setShowProductNotFound] = useState(false);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string>('');
  const [activeTab, setActiveTab] = useState('count');
  
  // Estados para gerenciamento de produtos
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productFormTab, setProductFormTab] = useState('list');
  
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
  } = useStock();

  const { 
    products,
    currentPage,
    totalPages,
    totalProducts,
    isLoading,
    findProductByCode, 
    addProduct,
    updateProduct,
    removeProduct,
    clearAllProducts,
    importFromText,
    goToPage,
    goToNextPage,
    goToPreviousPage
  } = useProducts();

  // Add console logs for debugging
  useEffect(() => {
    console.log('Stock items count:', totalItems);
    console.log('Products count:', totalProducts);
  }, [totalItems, totalProducts]);

  const handleBarcodeScanned = async (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    // Verifica se o produto está cadastrado
    const product = await findProductByCode(barcode);
    
    if (!product) {
      // Produto não cadastrado - mostra dialog
      setUnregisteredBarcode(barcode);
      setShowProductNotFound(true);
      return;
    }
    
    // Produto cadastrado - adiciona diretamente na contagem
    const existingItem = items.find(item => item.barcode === barcode);
    
    if (existingItem) {
      // Se já existe na lista, aumenta a quantidade
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      // Se não existe na lista, adiciona novo item
      addItem(barcode, 1);
    }
    
    // Toca beep de sucesso quando produto cadastrado é adicionado
    playSuccessBeep();
  };

  const getPendingProduct = async () => {
    if (!pendingBarcode) return undefined;
    return await findProductByCode(pendingBarcode);
  };

  const handleConfirmBarcode = () => {
    if (pendingBarcode) {
      // Verifica se o código já existe na lista
      const existingItem = items.find(item => item.barcode === pendingBarcode);
      
      if (existingItem) {
        // Se já existe, aumenta a quantidade
        updateQuantity(existingItem.id, existingItem.quantity + 1);
      } else {
        // Se não existe, adiciona novo item
        addItem(pendingBarcode, 1);
      }
      
      // Toca beep de sucesso quando produto é confirmado
      playSuccessBeep();
      setPendingBarcode(null);
    }
  };

  const handleCancelBarcode = () => {
    setPendingBarcode(null);
  };

  const handleAddProduct = async (data: any) => {
    const success = await addProduct(data);
    if (success) {
      setShowProductForm(false);
      setProductFormTab('list');
    }
    return success;
  };

  const handleUpdateProduct = async (data: any) => {
    if (!editingProduct) return false;
    const success = await updateProduct(editingProduct.id, data);
    if (success) {
      setEditingProduct(null);
      setShowProductForm(false);
      setProductFormTab('list');
    }
    return success;
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
    setProductFormTab('form');
  };

  const handleCancelProductForm = () => {
    setEditingProduct(null);
    setShowProductForm(false);
    setProductFormTab('list');
  };

  const handleImport = async (content: string) => {
    const imported = await importFromText(content);
    if (imported > 0) {
      setProductFormTab('list');
    }
    return imported;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        totalItems={totalItems}
        totalQuantity={totalQuantity}
        onExport={exportToFile}
        isExporting={isExporting}
      />
      
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Abas de navegação */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="count" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Contagem</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>Produtos</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="count" className="space-y-6">
            {/* Lista de Stock - Movida para cima */}
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
                // Quando um produto é selecionado via autocomplete
                setPendingBarcode(product.code);
              }}
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Tabs value={productFormTab} onValueChange={setProductFormTab} className="space-y-6">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="list" className="text-sm">Lista</TabsTrigger>
                  <TabsTrigger value="form" className="text-sm">Cadastrar</TabsTrigger>
                  <TabsTrigger value="import" className="text-sm">Importar</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="list" className="space-y-6">
                <ProductList
                  products={products}
                  onEdit={handleEditProduct}
                  onRemove={removeProduct}
                  onClearAll={clearAllProducts}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalProducts={totalProducts}
                  isLoading={isLoading}
                  onGoToPage={goToPage}
                  onGoToNextPage={goToNextPage}
                  onGoToPreviousPage={goToPreviousPage}
                />
              </TabsContent>

              <TabsContent value="form" className="space-y-6">
                <div className="max-w-2xl">
                  <ProductForm
                    product={editingProduct || undefined}
                    onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
                    onCancel={handleCancelProductForm}
                    isEditing={!!editingProduct}
                  />
                </div>
              </TabsContent>

              <TabsContent value="import" className="space-y-6">
                <div className="max-w-4xl">
                  <ProductImport onImport={handleImport} />
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de Confirmação */}
      {pendingBarcode && (
        <BarcodeConfirmation
          barcode={pendingBarcode}
          productDescription={undefined} // Será carregado assincronamente
          onConfirm={handleConfirmBarcode}
          onCancel={handleCancelBarcode}
        />
      )}

      {/* Dialog de Produto Não Cadastrado */}
      <ProductNotFoundDialog
        open={showProductNotFound}
        barcode={unregisteredBarcode}
        onConfirm={(productData: ProductFormData) => {
          // Cadastra o produto e adiciona à contagem
          addProduct(productData);
          const existingItem = items.find(item => item.barcode === unregisteredBarcode);
          if (existingItem) {
            updateQuantity(existingItem.id, existingItem.quantity + 1);
          } else {
            addItem(unregisteredBarcode, 1);
          }
          // Toca beep de sucesso quando produto é cadastrado e adicionado
          playSuccessBeep();
          setShowProductNotFound(false);
        }}
        onCancel={() => setShowProductNotFound(false)}
        onSkip={() => {
          // Pula cadastro e adiciona apenas a contagem
          const existingItem = items.find(item => item.barcode === unregisteredBarcode);
          if (existingItem) {
            updateQuantity(existingItem.id, existingItem.quantity + 1);
          } else {
            addItem(unregisteredBarcode, 1);
          }
          // Toca beep de sucesso quando produto é adicionado sem cadastro
          playSuccessBeep();
          setShowProductNotFound(false);
        }}
      />

      {/* Botão Flutuante para Scanner */}
      <div className="fixed bottom-6 left-6 z-40">
        <Button
          onClick={() => {
            // Simula um clique no botão do scanner
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
  );
};

export default Index;
