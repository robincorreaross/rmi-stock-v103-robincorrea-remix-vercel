import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QuantityDialogProps {
  open: boolean;
  currentQuantity: number;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
}

export function QuantityDialog({
  open,
  currentQuantity,
  onConfirm,
  onCancel
}: QuantityDialogProps) {
  const [quantity, setQuantity] = useState(currentQuantity.toString());

  const handleSubmit = () => {
    const newQuantity = parseInt(quantity);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      onConfirm(newQuantity);
    }
  };

  const handleCancel = () => {
    setQuantity(currentQuantity.toString());
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Quantidade</DialogTitle>
          <DialogDescription>
            Digite a nova quantidade para este item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Digite a quantidade"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!quantity || parseInt(quantity) < 1 || isNaN(parseInt(quantity))}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}