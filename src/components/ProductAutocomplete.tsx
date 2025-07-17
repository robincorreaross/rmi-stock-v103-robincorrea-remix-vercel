
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Package } from 'lucide-react';
import { Product } from '@/types/product';
import { useProducts } from '@/hooks/useProducts';

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onProductSelect: (product: Product) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ProductAutocomplete({
  value,
  onChange,
  onProductSelect,
  onSubmit,
  placeholder = "Digite código ou nome do produto...",
  disabled = false
}: ProductAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCache, setSearchCache] = useState<Map<string, Product[]>>(new Map());
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { searchProducts } = useProducts();

  // Função de busca otimizada com cache
  const performSearch = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setFilteredProducts([]);
      setIsSearching(false);
      return;
    }

    // Verificar cache primeiro
    const upperSearchTerm = searchTerm.toUpperCase();
    if (searchCache.has(upperSearchTerm)) {
      const cachedResults = searchCache.get(upperSearchTerm) || [];
      setFilteredProducts(cachedResults.slice(0, 5));
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const results = await searchProducts(upperSearchTerm);
      const limitedResults = results.slice(0, 5);
      
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
      
      setFilteredProducts(limitedResults);
    } catch (error) {
      console.error('Erro na busca:', error);
      setFilteredProducts([]);
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
      performSearch(value);
    }, 200); // Reduzido de 300ms para 200ms para resposta mais rápida

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [value, performSearch]);

  // Controlar visibilidade das sugestões de forma otimizada
  const shouldShowSuggestions = useMemo(() => {
    return filteredProducts.length > 0 && value.length >= 2 && !isSearching;
  }, [filteredProducts.length, value.length, isSearching]);

  useEffect(() => {
    setShowSuggestions(shouldShowSuggestions);
    if (shouldShowSuggestions) {
      setFocusedIndex(-1);
    }
  }, [shouldShowSuggestions]);

  // Lidar com eventos de teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        onSubmit();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredProducts.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredProducts.length) {
          handleProductSelect(filteredProducts[focusedIndex]);
        } else {
          onSubmit();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showSuggestions, filteredProducts, focusedIndex, onSubmit]);

  const handleProductSelect = useCallback((product: Product) => {
    onChange(product.code);
    setShowSuggestions(false);
    setFocusedIndex(-1);
    onProductSelect(product);
  }, [onChange, onProductSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Converter automaticamente para maiúsculas
    const upperValue = e.target.value.toUpperCase();
    onChange(upperValue);
  }, [onChange]);

  const handleInputFocus = useCallback(() => {
    if (filteredProducts.length > 0 && value.length >= 2) {
      setShowSuggestions(true);
    }
  }, [filteredProducts.length, value.length]);

  const handleInputBlur = useCallback(() => {
    // Delay para permitir clicks nas sugestões
    setTimeout(() => {
      setShowSuggestions(false);
      setFocusedIndex(-1);
    }, 200);
  }, []);

  // Memoizar componente de sugestão para evitar re-renders desnecessários
  const SuggestionItem = useCallback(({ product, index, isActive, onClick }: {
    product: Product;
    index: number;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <div
      className={`p-3 cursor-pointer border-b last:border-b-0 hover:bg-muted transition-colors ${
        isActive ? 'bg-muted' : ''
      }`}
      onClick={onClick}
      onMouseEnter={() => setFocusedIndex(index)}
    >
      <div className="flex items-start space-x-3">
        <Package className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
              {product.code}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground line-clamp-2">
            {product.description}
          </p>
        </div>
      </div>
    </div>
  ), []);

  return (
    <div className="relative w-full">
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        </div>
        <Button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          variant="quantity"
        >
          Adicionar
        </Button>
      </div>

      {/* Sugestões */}
      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border">
          <CardContent className="p-0" ref={suggestionsRef}>
            <div className="max-h-60 overflow-y-auto">
              {filteredProducts.map((product, index) => (
                <SuggestionItem
                  key={product.id}
                  product={product}
                  index={index}
                  isActive={index === focusedIndex}
                  onClick={() => handleProductSelect(product)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicador de carregamento otimizado */}
      {isSearching && value.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-40">
          <Card className="border-muted">
            <CardContent className="p-3 text-center">
              <p className="text-sm text-muted-foreground">
                Buscando produtos...
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Indicador de caracteres mínimos */}
      {value.length > 0 && value.length < 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-40">
          <Card className="border-muted">
            <CardContent className="p-3 text-center">
              <p className="text-sm text-muted-foreground">
                Digite pelo menos 2 caracteres para buscar produtos
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
