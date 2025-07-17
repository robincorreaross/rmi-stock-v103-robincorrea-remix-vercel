import { useState, useEffect } from 'react';
import { StockItem } from '@/types/stock';
import { generateFileName, convertToExportFormat } from '@/lib/stockUtils';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useStock() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Carregar itens do Supabase na inicialização
  useEffect(() => {
    loadStockItems();
  }, []);

  const loadStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const formattedItems = data.map(item => ({
        ...item,
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
      const { error } = await supabase
        .from('stock_items')
        .insert({
          barcode,
          quantity
        });

      if (error) throw error;

      await loadStockItems();
      
      toast({
        title: "Item adicionado!",
        description: `Código: ${barcode} - Qtd: ${quantity}`,
        variant: "default"
      });
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
      
      toast({
        title: "Item removido",
        description: "Item foi removido da contagem.",
        variant: "default"
      });
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
      
      toast({
        title: "Lista limpa",
        description: "Todos os itens foram removidos.",
        variant: "default"
      });
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
      toast({
        title: "Lista vazia",
        description: "Adicione itens antes de exportar.",
        variant: "destructive"
      });
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

        toast({
          title: "Exportação concluída!",
          description: `Arquivo ${fileName} salvo e compartilhado.`,
          variant: "default"
        });
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

        toast({
          title: "Arquivo baixado!",
          description: `${fileName} foi baixado para seus downloads.`,
          variant: "default"
        });
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