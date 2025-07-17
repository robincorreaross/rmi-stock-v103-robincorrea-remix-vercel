import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProductFormData } from '@/types/product';

interface ProductNotFoundDialogProps {
  open: boolean;
  barcode: string;
  onConfirm: (productData: ProductFormData) => void;
  onCancel: () => void;
  onSkip: () => void;
}

export function ProductNotFoundDialog({
  open,
  barcode,
  onConfirm,
  onCancel,
  onSkip
}: ProductNotFoundDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    code: barcode,
    description: ''
  });

  // Atualizar código quando barcode mudar
  useEffect(() => {
    setFormData(prev => ({ ...prev, code: barcode }));
  }, [barcode]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.description.trim()) return;

    setIsSubmitting(true);
    try {
      onConfirm(formData);
      setFormData({ code: barcode, description: '' });
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ code: barcode, description: '' });
    onCancel();
  };

  const handleSkip = () => {
    setFormData({ code: barcode, description: '' });
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Produto não cadastrado</span>
          </DialogTitle>
          <DialogDescription>
            O código <span className="font-mono font-semibold">{barcode}</span> não foi encontrado no cadastro de produtos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              Você pode cadastrar este produto agora ou pular e contar apenas pela quantidade.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="Código do produto"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Descrição *
                <span className="text-muted-foreground text-sm ml-1">
                  ({formData.description.length}/200)
                </span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value.toUpperCase() }))}
                placeholder="Digite a descrição do produto"
                maxLength={200}
                rows={3}
                autoFocus
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex space-x-2 order-2 sm:order-1">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={handleSkip} disabled={isSubmitting}>
              Pular
            </Button>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.description.trim()}
            className="order-1 sm:order-2"
          >
            {isSubmitting ? 'Cadastrando...' : 'Cadastrar e Contar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}