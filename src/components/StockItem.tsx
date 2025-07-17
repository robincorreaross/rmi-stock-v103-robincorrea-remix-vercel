
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { StockItem as StockItemType } from '@/types/stock';
import { formatDisplayDateTime } from '@/lib/stockUtils';
import { QuantityDialog } from '@/components/QuantityDialog';
import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/product';

interface StockItemProps {
  item: StockItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function StockItem({ item, onUpdateQuantity, onRemove }: StockItemProps) {
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const { findProductByCode } = useProducts();

  useEffect(() => {
    const loadProduct = async () => {
      const foundProduct = await findProductByCode(item.barcode);
      setProduct(foundProduct);
    };
    
    loadProduct();
  }, [item.barcode, findProductByCode]);
  
  const productDescription = product?.description || "PRODUTO NÃO CADASTRADO";

  const handleIncrement = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    } else {
      onRemove(item.id);
    }
  };

  const handleQuantityClick = () => {
    setShowQuantityDialog(true);
  };

  const handleQuantityChange = (newQuantity: number) => {
    onUpdateQuantity(item.id, newQuantity);
    setShowQuantityDialog(false);
  };

  return (
    <Card className="border shadow-card hover:shadow-lg transition-smooth bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-accent-foreground font-bold text-lg">
                  {item.quantity}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-mono text-sm font-medium text-foreground truncate">
                  {item.barcode}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {productDescription}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDisplayDateTime(item.timestamp)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              <button 
                onClick={handleQuantityClick}
                className="text-lg font-bold text-primary min-w-[2rem] text-center hover:bg-muted rounded px-2 py-1 transition-colors"
              >
                {item.quantity}
              </button>
              
              <Button
                variant="quantity"
                size="icon"
                onClick={handleIncrement}
                className="h-8 w-8"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Item</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este item da contagem?
                    <br />
                    <strong>Código: {item.barcode}</strong>
                    <br />
                    <strong>Quantidade: {item.quantity}</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onRemove(item.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
      
      <QuantityDialog
        open={showQuantityDialog}
        currentQuantity={item.quantity}
        onConfirm={handleQuantityChange}
        onCancel={() => setShowQuantityDialog(false)}
      />
    </Card>
  );
}
