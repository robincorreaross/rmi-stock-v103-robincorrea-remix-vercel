
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, Package, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types/product';
import { useProducts } from '@/hooks/useProducts';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  isLoading: boolean;
  onGoToPage: (page: number) => void;
  onGoToNextPage: () => void;
  onGoToPreviousPage: () => void;
}

export function ProductList({ 
  products, 
  onEdit, 
  onRemove, 
  onClearAll,
  currentPage,
  totalPages,
  totalProducts,
  isLoading,
  onGoToPage,
  onGoToNextPage,
  onGoToPreviousPage
}: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCache, setSearchCache] = useState<Map<string, Product[]>>(new Map());
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const { searchProducts } = useProducts();

  // Função de busca global no banco de dados
  const performSearch = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Verificar cache primeiro
    const upperSearchTerm = searchTerm.toUpperCase();
    if (searchCache.has(upperSearchTerm)) {
      const cachedResults = searchCache.get(upperSearchTerm) || [];
      setSearchResults(cachedResults);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const results = await searchProducts(upperSearchTerm);
      
      // Atualizar cache
      setSearchCache(prev => {
        const newCache = new Map(prev);
        newCache.set(upperSearchTerm, results);
        
        // Limitar tamanho do cache (manter últimas 50 buscas)
        if (newCache.size > 50) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        
        return newCache;
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error('Erro na busca:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchProducts, searchCache]);

  // Debounce da busca
  useEffect(() => {
    // Limpar timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Configurar novo timeout
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm, performSearch]);

  // Controlar qual lista de produtos mostrar
  const displayedProducts = searchTerm.length >= 2 ? searchResults : products;
  const isShowingSearchResults = searchTerm.length >= 2;

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Converter automaticamente para maiúsculas
    const upperValue = e.target.value.toUpperCase();
    setSearchTerm(upperValue);
  }, []);

  const handleDeleteProduct = () => {
    if (productToDelete) {
      onRemove(productToDelete.id);
      setProductToDelete(null);
    }
  };

  const handleClearAll = () => {
    onClearAll();
    setShowClearAllDialog(false);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => onGoToPage(i)}
            isActive={i === currentPage}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="font-semibold text-foreground mb-2">Carregando produtos...</h3>
            <p className="text-muted-foreground">Aguarde enquanto os produtos são carregados.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com busca e estatísticas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Produtos Cadastrados</span>
              <Badge variant="secondary">{totalProducts}</Badge>
            </CardTitle>
            {totalProducts > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearAllDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Limpar Todos
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages} • Mostrando {products.length} de {totalProducts} produtos
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar em todos os produtos cadastrados..."
              value={searchTerm}
              onChange={handleInputChange}
              className="pl-9"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          {isShowingSearchResults && (
            <div className="mt-2 text-sm text-muted-foreground">
              {searchResults.length > 0 
                ? `Encontrados ${searchResults.length} produtos em todo o banco de dados`
                : 'Nenhum produto encontrado em todo o banco de dados'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controles de Paginação - Topo */}
      {totalPages > 1 && !isShowingSearchResults && (
        <Card>
          <CardContent className="py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={onGoToPreviousPage}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {renderPaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={onGoToNextPage}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>
      )}

      {/* Lista de produtos */}
      {displayedProducts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              {isShowingSearchResults 
                ? 'Nenhum produto encontrado'
                : (products.length === 0 ? 'Nenhum produto nesta página' : 'Nenhum produto encontrado')
              }
            </h3>
            <p className="text-muted-foreground">
              {isShowingSearchResults 
                ? 'Tente usar outros termos de busca'
                : (products.length === 0 
                    ? 'Navegue para outras páginas para ver mais produtos'
                    : 'Tente usar outros termos de busca'
                  )
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {product.code}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {product.description}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Criado em {product.createdAt.toLocaleDateString('pt-BR')}
                      {product.updatedAt.getTime() !== product.createdAt.getTime() && (
                        <span> • Atualizado em {product.updatedAt.toLocaleDateString('pt-BR')}</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductToDelete(product)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Controles de Paginação - Rodapé */}
      {totalPages > 1 && !isShowingSearchResults && (
        <Card>
          <CardContent className="py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={onGoToPreviousPage}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {renderPaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={onGoToNextPage}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação para excluir produto */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span>Confirmar exclusão</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{productToDelete?.description}"?
              <br />
              <span className="font-medium">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para limpar todos */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span>Limpar todos os produtos</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir TODOS os {totalProducts} produtos cadastrados?
              <br />
              <span className="font-medium">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Limpar Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
