import { useState, useEffect } from 'react';
import { StockItem } from '@/types/stock';
import { generateFileName, convertToExportFormat } from '@/lib/stockUtils';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useStock(stockCountId?: string) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Carregar itens do Supabase na inicialização
  useEffect(() => {
    loadStockItems();
  }, []);

  const loadStockItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('stock_items')
        .select(`
          *,
          stock_counts!inner(user_id)
        `)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const formattedItems = data.map(item => ({
        id: item.id,
        barcode: item.barcode,
        quantity: item.quantity,
        timestamp: new Date(item.timestamp)
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      toast({
        title: "Erro ao carregar itens",
        description: "Não foi possível carregar os itens do banco de dados.",
        variant: "destructive"
      });
    }
  };

  const addItem = async (barcode: string, quantity: number = 1) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Usar stockCountId passado como parâmetro ou buscar um padrão
      let currentStockCountId = stockCountId;
      
      if (!currentStockCountId) {
        const { data: stockCounts } = await supabase
          .from('stock_counts')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        currentStockCountId = stockCounts?.[0]?.id;
      }

      // Se não houver nenhuma contagem, criar uma padrão
      if (!currentStockCountId) {
        const { data: newCount, error: countError } = await supabase
          .from('stock_counts')
          .insert({
            user_id: user.id,
            name: 'Contagem Padrão',
            counter_name: 'Sistema'
          })
          .select('id')
          .single();
        
        if (countError) throw countError;
        currentStockCountId = newCount.id;
      }

      const { error } = await supabase
        .from('stock_items')
        .insert({
          barcode,
          quantity,
          stock_count_id: currentStockCountId
        });

      if (error) throw error;

      await loadStockItems();
      
      // Removido toast de sucesso
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast({
        title: "Erro ao adicionar item",
        description: "Não foi possível adicionar o item.",
        variant: "destructive"
      });
    }
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(id);
      return;
    }

    try {
      const { error } = await supabase
        .from('stock_items')
        .update({ quantity: newQuantity })
        .eq('id', id);

      if (error) throw error;

      await loadStockItems();
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      toast({
        title: "Erro ao atualizar quantidade",
        description: "Não foi possível atualizar a quantidade.",
        variant: "destructive"
      });
    }
  };

  const removeItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadStockItems();
      
      // Removido toast de sucesso
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast({
        title: "Erro ao remover item",
        description: "Não foi possível remover o item.",
        variant: "destructive"
      });
    }
  };

  const clearAll = async () => {
    try {
      const { error } = await supabase
        .from('stock_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      await loadStockItems();
      
      // Removido toast de sucesso
    } catch (error) {
      console.error('Erro ao limpar lista:', error);
      toast({
        title: "Erro ao limpar lista",
        description: "Não foi possível limpar a lista.",
        variant: "destructive"
      });
    }
  };

  const exportToFile = async () => {
    if (items.length === 0) {
      // Removido toast informativo
      return;
    }

    setIsExporting(true);

    try {
      const content = convertToExportFormat(items);
      const fileName = generateFileName();

      // Tenta salvar no filesystem do dispositivo
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: content,
          directory: Directory.Documents
        });

        // Compartilha o arquivo
        await Share.share({
          title: 'Contagem de Estoque',
          text: `Arquivo de contagem: ${fileName}`,
          url: `file://${await Filesystem.getUri({
            directory: Directory.Documents,
            path: fileName
          }).then(result => result.uri)}`
        });

        // Removido toast de sucesso
      } catch (nativeError) {
        // Fallback para download no navegador
        console.log('Tentando fallback para navegador:', nativeError);
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Removido toast de sucesso
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o arquivo.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearAll,
    exportToFile,
    isExporting,
    totalItems: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0)
  };
}