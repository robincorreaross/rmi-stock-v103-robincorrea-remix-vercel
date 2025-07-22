import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductForm } from '@/components/ProductForm';
import { ProductList } from '@/components/ProductList';
import { ProductImport } from '@/components/ProductImport';
import { useProducts } from '@/hooks/useProducts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Package, Upload, List, ArrowLeft, LogOut } from 'lucide-react';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export const Products = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          navigate('/auth');
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const {
    products,
    currentPage,
    totalPages,
    totalProducts,
    isLoading,
    addProduct,
    updateProduct,
    removeProduct,
    clearAllProducts,
    importFromText,
    goToPage,
    goToNextPage,
    goToPreviousPage
  } = useProducts();

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  const handleAddProduct = async (data: any) => {
    const success = await addProduct(data);
    if (success) {
      setShowForm(false);
      setActiveTab('list');
    }
    return success;
  };

  const handleUpdateProduct = async (data: any) => {
    if (!editingProduct) return false;
    const success = await updateProduct(editingProduct.id, data);
    if (success) {
      setEditingProduct(null);
      setShowForm(false);
      setActiveTab('list');
    }
    return success;
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
    setActiveTab('form');
  };

  const handleCancelForm = () => {
    setEditingProduct(null);
    setShowForm(false);
    setActiveTab('list');
  };

  const handleImport = async (content: string) => {
    const imported = await importFromText(content);
    if (imported > 0) {
      setActiveTab('list');
    }
    return imported;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
              <h1 className="text-xl font-semibold">Produtos</h1>
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
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center space-x-3">
            <Package className="w-8 h-8" />
            <span>Gerenciamento de Produtos</span>
          </h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie produtos para facilitar a contagem de estoque. Total: {totalProducts} produtos
          </p>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="list" className="flex items-center space-x-2">
              <List className="w-4 h-4" />
              <span>Lista</span>
            </TabsTrigger>
            <TabsTrigger value="form" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Cadastrar</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Importar</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === 'list' && (
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  setShowForm(true);
                  setActiveTab('form');
                }}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Produto</span>
              </Button>
            </div>
          )}
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
              onCancel={handleCancelForm}
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
      </div>
    </div>
  );
};