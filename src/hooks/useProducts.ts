import { useState, useEffect } from 'react';
import { Product, ProductFormData } from '@/types/product';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

const ITEMS_PER_PAGE = 100;

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Carregar produtos do Supabase na inicialização
  useEffect(() => {
    loadProducts();
  }, [currentPage]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      console.log(`Carregando página ${currentPage}...`);
      
      // Primeiro, vamos contar quantos produtos existem
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Erro ao contar produtos:', countError);
        throw countError;
      }

      const totalCount = count || 0;
      setTotalProducts(totalCount);
      setTotalPages(Math.ceil(totalCount / ITEMS_PER_PAGE));
      
      console.log(`Total de produtos no banco: ${totalCount}`);
      console.log(`Total de páginas: ${Math.ceil(totalCount / ITEMS_PER_PAGE)}`);

      // Agora vamos buscar os produtos da página atual
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      console.log(`Produtos carregados da página ${currentPage}: ${data.length}`);

      const formattedProducts = data.map(product => ({
        ...product,
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at)
      }));

      setProducts(formattedProducts);
      console.log(`Produtos definidos no estado: ${formattedProducts.length}`);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar os produtos do banco de dados.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (data: ProductFormData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .insert({
        code: data.code.toUpperCase(),
        description: data.description.toUpperCase().substring(0, 200)
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Código já existe",
            description: "Já existe um produto com este código.",
            variant: "destructive"
          });
          return false;
        }
        throw error;
      }

      await loadProducts();
      
      toast({
        title: "Produto cadastrado!",
        description: `${data.description}`,
        variant: "default"
      });

      return true;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast({
        title: "Erro ao cadastrar produto",
        description: "Não foi possível cadastrar o produto.",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateProduct = async (id: string, data: ProductFormData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
        code: data.code.toUpperCase(),
        description: data.description.toUpperCase().substring(0, 200)
        })
        .eq('id', id);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Código já existe",
            description: "Já existe outro produto com este código.",
            variant: "destructive"
          });
          return false;
        }
        throw error;
      }

      await loadProducts();

      toast({
        title: "Produto atualizado!",
        description: `${data.description}`,
        variant: "default"
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: "Erro ao atualizar produto",
        description: "Não foi possível atualizar o produto.",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeProduct = async (id: string) => {
    try {
      const product = products.find(p => p.id === id);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadProducts();
      
      toast({
        title: "Produto removido",
        description: product ? product.description : "Produto foi removido.",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      toast({
        title: "Erro ao remover produto",
        description: "Não foi possível remover o produto.",
        variant: "destructive"
      });
    }
  };

  const clearAllProducts = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      await loadProducts();
      
      toast({
        title: "Produtos limpos",
        description: "Todos os produtos foram removidos.",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao limpar produtos:', error);
      toast({
        title: "Erro ao limpar produtos",
        description: "Não foi possível limpar os produtos.",
        variant: "destructive"
      });
    }
  };

  const findProductByCode = async (code: string): Promise<Product | undefined> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('code', code.toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        return {
          ...data,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
      }

      return undefined;
    } catch (error) {
      console.error('Erro ao buscar produto por código:', error);
      return undefined;
    }
  };

  const searchProducts = async (query: string): Promise<Product[]> => {
    if (query.length < 2) return [];
    
    try {
      const upperQuery = query.toUpperCase();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`description.ilike.%${upperQuery}%,code.ilike.%${upperQuery}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data.map(product => ({
        ...product,
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at)
      }));
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  };

  const importFromText = async (content: string): Promise<number> => {
    const lines = content.split('\n').filter(line => line.trim());
    let skippedCount = 0;

    const productsToInsert = [];
    const batchSize = 1000; // Processar em lotes para evitar problemas com arquivos grandes

    for (const line of lines) {
      const parts = line.split(';');
      if (parts.length >= 3) {
        const internalCode = parts[0]?.trim();
        const barcode = parts[1]?.trim();
        const description = parts[2]?.trim();

        // Usar código interno se código de barras for 0000000000000
        const productCode = barcode === '0000000000000' ? internalCode : barcode;

        if (productCode && description) {
          // Verificar se já existe
          const existingProduct = await findProductByCode(productCode);
          if (!existingProduct) {
            productsToInsert.push({
              code: productCode.toUpperCase(),
              description: description.toUpperCase().substring(0, 200)
            });
          } else {
            skippedCount++;
          }
        }
      }
    }

    if (productsToInsert.length > 0) {
      let totalImported = 0;
      
      try {
        // Processar em lotes
        for (let i = 0; i < productsToInsert.length; i += batchSize) {
          const batch = productsToInsert.slice(i, i + batchSize);
          
          console.log(`Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(productsToInsert.length / batchSize)}: ${batch.length} produtos`);
          
          const { error } = await supabase
            .from('products')
            .insert(batch);

          if (error) {
            console.error(`Erro no lote ${Math.floor(i / batchSize) + 1}:`, error);
            // Continue com o próximo lote mesmo se houver erro
            continue;
          }
          
          totalImported += batch.length;
        }

        await loadProducts();
        
        toast({
          title: "Importação concluída!",
          description: `${totalImported} produtos importados${skippedCount > 0 ? `, ${skippedCount} já existiam` : ''}.`,
          variant: "default"
        });
        
        return totalImported;
      } catch (error) {
        console.error('Erro na importação:', error);
        toast({
          title: "Erro na importação",
          description: `Importação parcial: ${totalImported} produtos importados. Verifique os logs para mais detalhes.`,
          variant: "destructive"
        });
        return totalImported;
      }
    } else {
      toast({
        title: "Nenhum produto importado",
        description: skippedCount > 0 ? "Todos os produtos já existiam." : "Formato de arquivo inválido.",
        variant: "destructive"
      });
      return 0;
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return {
    products,
    currentPage,
    totalPages,
    totalProducts,
    isLoading,
    addProduct,
    updateProduct,
    removeProduct,
    clearAllProducts,
    findProductByCode,
    searchProducts,
    importFromText,
    goToPage,
    goToNextPage,
    goToPreviousPage
  };
}
