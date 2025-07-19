import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Product } from '@/types/product';
import { StockItem } from '@/types/stock';

export function useLocalStorage() {
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Salvar produtos localmente
  const saveProductsLocal = async (products: Product[]) => {
    try {
      await Preferences.set({
        key: 'local_products',
        value: JSON.stringify(products)
      });
    } catch (error) {
      console.error('Erro ao salvar produtos localmente:', error);
    }
  };

  // Carregar produtos locais
  const loadProductsLocal = async (): Promise<Product[]> => {
    try {
      const { value } = await Preferences.get({ key: 'local_products' });
      if (value) {
        const products = JSON.parse(value);
        return products.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Erro ao carregar produtos locais:', error);
      return [];
    }
  };

  // Salvar itens de estoque localmente
  const saveStockLocal = async (items: StockItem[]) => {
    try {
      await Preferences.set({
        key: 'local_stock',
        value: JSON.stringify(items)
      });
    } catch (error) {
      console.error('Erro ao salvar estoque localmente:', error);
    }
  };

  // Carregar estoque local
  const loadStockLocal = async (): Promise<StockItem[]> => {
    try {
      const { value } = await Preferences.get({ key: 'local_stock' });
      if (value) {
        const items = JSON.parse(value);
        return items.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
      return [];
    } catch (error) {
      console.error('Erro ao carregar estoque local:', error);
      return [];
    }
  };

  // Verificar se está no modo offline
  const checkOfflineMode = async () => {
    try {
      const { value } = await Preferences.get({ key: 'offline_mode' });
      setIsOfflineMode(value === 'true');
    } catch (error) {
      console.error('Erro ao verificar modo offline:', error);
    }
  };

  // Alternar modo offline
  const toggleOfflineMode = async () => {
    try {
      const newMode = !isOfflineMode;
      await Preferences.set({
        key: 'offline_mode',
        value: newMode.toString()
      });
      setIsOfflineMode(newMode);
    } catch (error) {
      console.error('Erro ao alternar modo offline:', error);
    }
  };

  // Limpar dados locais
  const clearLocalData = async () => {
    try {
      await Preferences.remove({ key: 'local_products' });
      await Preferences.remove({ key: 'local_stock' });
      await Preferences.remove({ key: 'offline_mode' });
      setIsOfflineMode(false);
    } catch (error) {
      console.error('Erro ao limpar dados locais:', error);
    }
  };

  useEffect(() => {
    checkOfflineMode();
  }, []);

  return {
    isOfflineMode,
    toggleOfflineMode,
    saveProductsLocal,
    loadProductsLocal,
    saveStockLocal,
    loadStockLocal,
    clearLocalData
  };
}